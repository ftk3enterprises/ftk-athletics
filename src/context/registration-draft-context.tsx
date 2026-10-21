"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { registrationDraftKey, readStorage, writeStorage } from "@/lib/storage";
import { useAuth } from "@/context/auth-context";

/** For a session with a DateSelectionConfig: the specific dates (type "daily") or week ids (type "weekly") picked. */
export interface DateSelectionValue {
  dates?: string[];
  weekIds?: string[];
}

export interface RegistrationDraft {
  /** Child ids, plus the literal sentinel "self" for the signed-in parent/adult. */
  participantIds: string[];
  programIds: string[];
  /** participantId -> the program ids that participant is registering for. */
  assignments: Record<string, string[]>;
  /** `${participantId}:${programId}` -> session ids that participant selected for that program. */
  sessionSelections: Record<string, string[]>;
  /** `${participantId}:${programId}` -> chosen school/location, for programs where requiresSchoolSelection is true. */
  schoolSelections: Record<string, string>;
  /** `${participantId}:${programId}` -> picked dates/weeks, only for sessions with a DateSelectionConfig. */
  dateSelections: Record<string, DateSelectionValue>;
  /** Populated once Review creates the Registration records. */
  registrationIds: string[];
  /** Populated once Payment creates the checkout session. */
  paymentId: string | null;
}

const EMPTY_DRAFT: RegistrationDraft = {
  participantIds: [],
  programIds: [],
  assignments: {},
  sessionSelections: {},
  schoolSelections: {},
  dateSelections: {},
  registrationIds: [],
  paymentId: null,
};

export function schoolSelectionKey(participantId: string, programId: string): string {
  return `${participantId}:${programId}`;
}

export function sessionSelectionKey(participantId: string, programId: string): string {
  return `${participantId}:${programId}`;
}

interface RegistrationDraftContextValue {
  draft: RegistrationDraft;
  /**
   * False until the draft has been hydrated from THIS signed-in user's own
   * scoped storage key. Consumers (see RegisterGuard in
   * src/app/register/layout.tsx) must not render step content or run their
   * "draft looks empty, redirect away" guards until this is true — otherwise
   * a page could briefly act on another account's leftover draft, or on an
   * empty draft that hasn't been hydrated yet.
   */
  draftReady: boolean;
  toggleParticipant: (id: string) => void;
  toggleProgram: (id: string) => void;
  toggleAssignment: (participantId: string, programId: string) => void;
  /** mode "single" replaces the selection (radio); "multiple" toggles the session in/out of the set (checkbox). */
  setSessionSelection: (
    participantId: string,
    programId: string,
    sessionId: string,
    mode: "single" | "multiple"
  ) => void;
  setSchoolSelection: (participantId: string, programId: string, value: string) => void;
  /** Empties session/school/date selections for this participant+program — used when switching schools in the after-school calendar picker so a session for the old school never lingers as "selected". */
  clearSessionSelection: (participantId: string, programId: string) => void;
  setDateSelection: (participantId: string, programId: string, value: DateSelectionValue) => void;
  seedProgram: (programId: string) => void;
  seedParticipant: (participantId: string) => void;
  seedAssignment: (participantId: string, programId: string) => void;
  setRegistrationIds: (ids: string[]) => void;
  setPaymentId: (id: string) => void;
  reset: () => void;
}

const RegistrationDraftContext = createContext<RegistrationDraftContextValue | null>(null);

export function RegistrationDraftProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  // Starts empty and NOT ready — the storage key is scoped per user id, so
  // there is nothing safe to read until auth has resolved who (if anyone)
  // is signed in. Consumers must gate on `draftReady` (see the interface
  // comment above) rather than assuming a synchronous first read like the
  // old shared-key version did.
  const [draft, setDraft] = useState<RegistrationDraft>(EMPTY_DRAFT);
  const [draftReady, setDraftReady] = useState(false);
  // `undefined` means "never hydrated yet"; distinct from `null`, which is
  // a real hydrated state (signed out). Adjusted directly during render
  // (React's documented pattern for resetting state when an input changes)
  // rather than in an effect, since re-deriving on every userId change is
  // exactly the "it changed, respond immediately" case React recommends
  // this for — localStorage.getItem is a synchronous, side-effect-free read
  // as far as React is concerned, so it's safe to call here.
  const [hydratedForUserId, setHydratedForUserId] = useState<string | null | undefined>(undefined);

  if (!authLoading && hydratedForUserId !== userId) {
    setHydratedForUserId(userId);
    setDraft(userId ? readStorage(registrationDraftKey(userId), EMPTY_DRAFT) : EMPTY_DRAFT);
    setDraftReady(true);
  }

  useEffect(() => {
    if (!draftReady || !userId) return;
    writeStorage(registrationDraftKey(userId), draft);
  }, [draft, draftReady, userId]);

  const toggleParticipant = useCallback((id: string) => {
    setDraft((prev) => {
      const selected = prev.participantIds.includes(id);
      const participantIds = selected
        ? prev.participantIds.filter((p) => p !== id)
        : [...prev.participantIds, id];
      const assignments = { ...prev.assignments };
      const schoolSelections = { ...prev.schoolSelections };
      const sessionSelections = { ...prev.sessionSelections };
      const dateSelections = { ...prev.dateSelections };
      if (selected) {
        for (const programId of assignments[id] ?? []) {
          delete schoolSelections[schoolSelectionKey(id, programId)];
          delete sessionSelections[sessionSelectionKey(id, programId)];
          delete dateSelections[sessionSelectionKey(id, programId)];
        }
        delete assignments[id];
      }
      return { ...prev, participantIds, assignments, schoolSelections, sessionSelections, dateSelections };
    });
  }, []);

  const toggleProgram = useCallback((id: string) => {
    setDraft((prev) => {
      const selected = prev.programIds.includes(id);
      const programIds = selected
        ? prev.programIds.filter((p) => p !== id)
        : [...prev.programIds, id];
      const assignments = selected
        ? Object.fromEntries(
            Object.entries(prev.assignments).map(([participantId, ids]) => [
              participantId,
              ids.filter((programId) => programId !== id),
            ])
          )
        : prev.assignments;
      const schoolSelections = selected
        ? Object.fromEntries(
            Object.entries(prev.schoolSelections).filter(
              ([key]) => !key.endsWith(`:${id}`)
            )
          )
        : prev.schoolSelections;
      const sessionSelections = selected
        ? Object.fromEntries(
            Object.entries(prev.sessionSelections).filter(
              ([key]) => !key.endsWith(`:${id}`)
            )
          )
        : prev.sessionSelections;
      const dateSelections = selected
        ? Object.fromEntries(
            Object.entries(prev.dateSelections).filter(
              ([key]) => !key.endsWith(`:${id}`)
            )
          )
        : prev.dateSelections;
      return { ...prev, programIds, assignments, schoolSelections, sessionSelections, dateSelections };
    });
  }, []);

  const toggleAssignment = useCallback((participantId: string, programId: string) => {
    setDraft((prev) => {
      const current = prev.assignments[participantId] ?? [];
      const wasAssigned = current.includes(programId);
      const next = wasAssigned
        ? current.filter((id) => id !== programId)
        : [...current, programId];
      const schoolSelections = { ...prev.schoolSelections };
      const sessionSelections = { ...prev.sessionSelections };
      const dateSelections = { ...prev.dateSelections };
      if (wasAssigned) {
        delete schoolSelections[schoolSelectionKey(participantId, programId)];
        delete sessionSelections[sessionSelectionKey(participantId, programId)];
        delete dateSelections[sessionSelectionKey(participantId, programId)];
      }
      return {
        ...prev,
        assignments: { ...prev.assignments, [participantId]: next },
        schoolSelections,
        sessionSelections,
        dateSelections,
      };
    });
  }, []);

  const setSessionSelection = useCallback(
    (participantId: string, programId: string, sessionId: string, mode: "single" | "multiple") => {
      setDraft((prev) => {
        const key = sessionSelectionKey(participantId, programId);
        const current = prev.sessionSelections[key] ?? [];
        const removing = current.includes(sessionId) && mode === "multiple";
        const next =
          mode === "single"
            ? [sessionId]
            : removing
              ? current.filter((id) => id !== sessionId)
              : [...current, sessionId];
        // Switching which session is selected (single mode) or deselecting
        // one (multiple mode) invalidates any date/week picks made for it —
        // a stale selection must never silently carry over to a different
        // session.
        const dateSelections = { ...prev.dateSelections };
        if (mode === "single" ? !current.includes(sessionId) : removing) {
          delete dateSelections[key];
        }
        return {
          ...prev,
          sessionSelections: { ...prev.sessionSelections, [key]: next },
          dateSelections,
        };
      });
    },
    []
  );

  const setDateSelection = useCallback(
    (participantId: string, programId: string, value: DateSelectionValue) => {
      setDraft((prev) => ({
        ...prev,
        dateSelections: { ...prev.dateSelections, [sessionSelectionKey(participantId, programId)]: value },
      }));
    },
    []
  );

  const clearSessionSelection = useCallback((participantId: string, programId: string) => {
    setDraft((prev) => {
      const key = sessionSelectionKey(participantId, programId);
      const sessionSelections = { ...prev.sessionSelections };
      const schoolSelections = { ...prev.schoolSelections };
      const dateSelections = { ...prev.dateSelections };
      delete sessionSelections[key];
      delete schoolSelections[key];
      delete dateSelections[key];
      return { ...prev, sessionSelections, schoolSelections, dateSelections };
    });
  }, []);

  const setSchoolSelection = useCallback((participantId: string, programId: string, value: string) => {
    setDraft((prev) => ({
      ...prev,
      schoolSelections: { ...prev.schoolSelections, [schoolSelectionKey(participantId, programId)]: value },
    }));
  }, []);

  const seedProgram = useCallback((programId: string) => {
    setDraft((prev) =>
      prev.programIds.includes(programId)
        ? prev
        : { ...prev, programIds: [...prev.programIds, programId] }
    );
  }, []);

  const seedParticipant = useCallback((participantId: string) => {
    setDraft((prev) =>
      prev.participantIds.includes(participantId)
        ? prev
        : { ...prev, participantIds: [...prev.participantIds, participantId] }
    );
  }, []);

  const seedAssignment = useCallback((participantId: string, programId: string) => {
    setDraft((prev) => {
      const current = prev.assignments[participantId] ?? [];
      if (current.includes(programId)) return prev;
      return { ...prev, assignments: { ...prev.assignments, [participantId]: [...current, programId] } };
    });
  }, []);

  const setRegistrationIds = useCallback((ids: string[]) => {
    setDraft((prev) => ({ ...prev, registrationIds: ids }));
  }, []);

  const setPaymentId = useCallback((id: string) => {
    setDraft((prev) => ({ ...prev, paymentId: id }));
  }, []);

  const reset = useCallback(() => {
    setDraft(EMPTY_DRAFT);
  }, []);

  const value = useMemo(
    () => ({
      draft,
      draftReady,
      toggleParticipant,
      toggleProgram,
      toggleAssignment,
      setSessionSelection,
      setSchoolSelection,
      clearSessionSelection,
      setDateSelection,
      seedProgram,
      seedParticipant,
      seedAssignment,
      setRegistrationIds,
      setPaymentId,
      reset,
    }),
    [
      draft,
      draftReady,
      toggleParticipant,
      toggleProgram,
      toggleAssignment,
      setSessionSelection,
      setSchoolSelection,
      clearSessionSelection,
      setDateSelection,
      seedProgram,
      seedParticipant,
      seedAssignment,
      setRegistrationIds,
      setPaymentId,
      reset,
    ]
  );

  return (
    <RegistrationDraftContext.Provider value={value}>{children}</RegistrationDraftContext.Provider>
  );
}

export function useRegistrationDraft(): RegistrationDraftContextValue {
  const ctx = useContext(RegistrationDraftContext);
  if (!ctx) throw new Error("useRegistrationDraft must be used within RegistrationDraftProvider");
  return ctx;
}

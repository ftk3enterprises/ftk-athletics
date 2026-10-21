"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Family, User } from "@/types";
import * as authService from "@/services/auth-service";
import * as profileService from "@/services/profile-service";

interface AuthContextValue {
  user: User | null;
  family: Family | null;
  isAdmin: boolean;
  isLoading: boolean;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<{ needsEmailConfirmation: boolean }>;
  signIn: (input: { email: string; password: string }) => Promise<{ isAdmin: boolean }>;
  signOut: () => Promise<void>;
  refreshFamily: () => Promise<void>;
  ensureFamily: (input: { phone: string; interestedProgramIds?: string[] }) => Promise<Family>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadFamily = useCallback(async (userId: string) => {
    const existing = await profileService.getFamilyByUserId(userId);
    setFamily(existing);
  }, []);

  const loadAdminStatus = useCallback(async (userId: string): Promise<boolean> => {
    const admin = await authService.checkIsAdmin(userId);
    setIsAdmin(admin);
    return admin;
  }, []);

  useEffect(() => {
    (async () => {
      const current = await authService.getCurrentUser();
      setUser(current);
      if (current) await Promise.all([loadFamily(current.id), loadAdminStatus(current.id)]);
      setIsLoading(false);
    })();
  }, [loadFamily, loadAdminStatus]);

  const signUp = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      const { user: newUser, needsEmailConfirmation } = await authService.signUp(input);
      if (needsEmailConfirmation) return { needsEmailConfirmation: true };
      setUser(newUser);
      await Promise.all([loadFamily(newUser.id), loadAdminStatus(newUser.id)]);
      return { needsEmailConfirmation: false };
    },
    [loadFamily, loadAdminStatus]
  );

  const signIn = useCallback(
    async (input: { email: string; password: string }) => {
      const signedInUser = await authService.signIn(input);
      setUser(signedInUser);
      const [, admin] = await Promise.all([loadFamily(signedInUser.id), loadAdminStatus(signedInUser.id)]);
      return { isAdmin: admin };
    },
    [loadFamily, loadAdminStatus]
  );

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setFamily(null);
    setIsAdmin(false);
  }, []);

  const refreshFamily = useCallback(async () => {
    if (user) await loadFamily(user.id);
  }, [user, loadFamily]);

  const ensureFamily = useCallback(
    async (input: { phone: string; interestedProgramIds?: string[] }) => {
      if (!user) throw new Error("Must be signed in to create a family profile.");
      if (family) return family;
      const created = await profileService.createFamily({
        userId: user.id,
        parentName: user.name,
        email: user.email,
        phone: input.phone,
        interestedProgramIds: input.interestedProgramIds,
      });
      setFamily(created);
      return created;
    },
    [user, family]
  );

  const value = useMemo(
    () => ({ user, family, isAdmin, isLoading, signUp, signIn, signOut, refreshFamily, ensureFamily }),
    [user, family, isAdmin, isLoading, signUp, signIn, signOut, refreshFamily, ensureFamily]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

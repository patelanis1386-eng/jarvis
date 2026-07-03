"use client"

import { useAuthStore } from "@/stores/auth-store"

export function useAuth() {
  const { user, isAuthenticated, isLoading, error, login, logout, register, updateUser: updateProfile } = useAuthStore()

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    updateProfile,
  }
}

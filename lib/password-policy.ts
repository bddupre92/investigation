import { AUTH_CONFIG } from "./auth-constants"

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (password.length < AUTH_CONFIG.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters`)
  }
  if (AUTH_CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push("Must contain at least one uppercase letter")
  }
  if (AUTH_CONFIG.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push("Must contain at least one lowercase letter")
  }
  if (AUTH_CONFIG.PASSWORD_REQUIRE_DIGIT && !/\d/.test(password)) {
    errors.push("Must contain at least one digit")
  }
  if (AUTH_CONFIG.PASSWORD_REQUIRE_SPECIAL && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push("Must contain at least one special character")
  }

  return { valid: errors.length === 0, errors }
}

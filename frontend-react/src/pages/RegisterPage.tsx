import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { register, error, clearError } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "password") {
      // Calculate password strength
      let strength = 0;
      if (value.length >= 8) strength += 1;
      if (/[a-z]/.test(value)) strength += 1;
      if (/[A-Z]/.test(value)) strength += 1;
      if (/[0-9]/.test(value)) strength += 1;
      if (/[^A-Za-z0-9]/.test(value)) strength += 1;
      setPasswordStrength(strength);
    }

    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.password_confirmation
    )
      return;

    setIsLoading(true);
    try {
      await register(
        formData.name,
        formData.email,
        formData.password,
        formData.password_confirmation
      );
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    if (passwordStrength <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 3) return "Fair";
    if (passwordStrength <= 4) return "Good";
    return "Strong";
  };

  const isFormValid =
    formData.name &&
    formData.email &&
    formData.password &&
    formData.password_confirmation &&
    passwordStrength >= 3 &&
    formData.password === formData.password_confirmation;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="w-20 h-20 bg-indigo-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <span className="text-3xl text-white font-bold">AI</span>
          </div>
          <h1 className="text-4xl font-bold text-indigo-700 mb-3">
            Join AI Notes
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            Create your account to get started
          </p>
        </div>

        {/* Registration Form */}
        <Card className="shadow-2xl border-2 border-slate-200 bg-white/90 backdrop-blur-md animate-slide-up">
          <CardHeader className="space-y-3 pb-6">
            <CardTitle className="text-3xl text-center text-slate-900 font-bold">
              Create Account
            </CardTitle>
            <CardDescription className="text-center text-slate-600 text-lg">
              Start your AI-powered note-taking journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <div className="space-y-3">
                <Label
                  htmlFor="name"
                  className="text-slate-700 font-bold text-lg"
                >
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="h-12 border-2 border-slate-200 focus:border-indigo-700 focus:ring-indigo-700 transition-all duration-200 text-base shadow-md hover:shadow-lg"
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Email Field */}
              <div className="space-y-3">
                <Label
                  htmlFor="email"
                  className="text-slate-700 font-bold text-lg"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="h-12 border-2 border-slate-200 focus:border-indigo-700 focus:ring-indigo-700 transition-all duration-200 text-base shadow-md hover:shadow-lg"
                  disabled={isLoading}
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-3">
                <Label
                  htmlFor="password"
                  className="text-slate-700 font-bold text-lg"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className="h-12 pr-12 border-2 border-slate-200 focus:border-indigo-700 focus:ring-indigo-700 transition-all duration-200 text-base shadow-md hover:shadow-lg"
                    disabled={isLoading}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-all duration-200 p-1 rounded-lg hover:bg-slate-100"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-3 bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700">
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle
                        size={14}
                        className={
                          formData.password.length >= 8
                            ? "text-green-500"
                            : "text-slate-300"
                        }
                      />
                      <span>At least 8 characters</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-3">
                <Label
                  htmlFor="password_confirmation"
                  className="text-slate-700 font-bold text-lg"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="password_confirmation"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.password_confirmation}
                    onChange={(e) =>
                      handleInputChange("password_confirmation", e.target.value)
                    }
                    className={`h-12 pr-12 border-2 border-slate-200 focus:ring-indigo-700 transition-all duration-200 text-base shadow-md hover:shadow-lg ${
                      formData.password_confirmation &&
                      formData.password !== formData.password_confirmation
                        ? "border-red-300 focus:border-red-500"
                        : "focus:border-indigo-700"
                    }`}
                    disabled={isLoading}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-all duration-200 p-1 rounded-lg hover:bg-slate-100"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {formData.password_confirmation && (
                  <div className="flex items-center gap-3 text-base bg-slate-100 p-3 rounded-xl border border-slate-200">
                    {formData.password === formData.password_confirmation ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-red-300" />
                    )}
                    <span
                      className={
                        formData.password === formData.password_confirmation
                          ? "text-green-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {formData.password === formData.password_confirmation
                        ? "Passwords match"
                        : "Passwords do not match"}
                    </span>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-shake shadow-md">
                  <p className="text-base text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 disabled:transform-none disabled:opacity-50"
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-white px-4 text-slate-500 font-semibold">
                  Or
                </span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-slate-600 text-lg">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-indigo-700 hover:text-indigo-800 font-bold transition-all duration-200 hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 animate-fade-in-delayed">
          <p className="text-base text-slate-500 font-medium">
            AI-powered note-taking made simple
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

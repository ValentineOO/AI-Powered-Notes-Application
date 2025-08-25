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
import { Eye, EyeOff, Loader2 } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = () => {
    if (error) clearError();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="w-20 h-20 bg-indigo-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <span className="text-3xl text-white font-bold">AI</span>
          </div>
          <h1 className="text-4xl font-bold text-indigo-700 mb-3">
            Welcome Back
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            Sign in to your AI Notes account
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-2xl border-2 border-slate-200 bg-white/90 backdrop-blur-md animate-slide-up">
          <CardHeader className="space-y-3 pb-6">
            <CardTitle className="text-3xl text-center text-slate-900 font-bold">
              Sign In
            </CardTitle>
            <CardDescription className="text-center text-slate-600 text-lg">
              Enter your credentials to access your notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    handleInputChange();
                  }}
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
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      handleInputChange();
                    }}
                    className="h-12 pr-12 border-2 border-slate-200 focus:border-indigo-700 focus:ring-indigo-700 transition-all duration-200 text-base shadow-md hover:shadow-lg"
                    disabled={isLoading}
                    required
                    autoComplete="current-password"
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
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing In...
                  </div>
                ) : (
                  "Sign In"
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

            {/* Register Link */}
            <div className="text-center">
              <p className="text-slate-600 text-lg">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-indigo-700 hover:text-indigo-800 font-bold transition-all duration-200 hover:underline"
                >
                  Sign up here
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

export default LoginPage;


// import { useRef, useState  , useEffect} from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { login as apiLogin } from "../services/api";
// import { useAuth } from "../context/AuthContext";
// import { Eye, EyeOff, Lock } from "lucide-react";
// import axios from "axios";
// import Logo from "../components/Logo";

// const Login = () => {
//   const [formData, setFormData] = useState({ email: "", password: "" });
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showOTP, setShowOTP] = useState(false);
//   const [otp, setOtp] = useState(['', '', '', '', '', '']);
//   const [otpLoading, setOtpLoading] = useState(false);
//   const [resendTimer, setResendTimer] = useState(0);
//   const otpInputs = useRef([]);

//   const { login } = useAuth();
//   const navigate = useNavigate();

//   // Timer for resend OTP
//   useEffect(() => {
//     if (resendTimer > 0) {
//       const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [resendTimer]);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   // Handle OTP input
//   const handleOtpChange = (index, value) => {
//     if (value.length > 1) {
//       value = value.slice(0, 1);
//     }
    
//     const newOtp = [...otp];
//     newOtp[index] = value;
//     setOtp(newOtp);

//     // Auto-focus next input
//     if (value && index < 5) {
//       otpInputs.current[index + 1]?.focus();
//     }

//     // Auto-submit when all 6 digits are entered
//     if (newOtp.every(digit => digit !== '') && index === 5) {
//       handleVerifyOTP(newOtp.join(''));
//     }
//   };

//   // Handle backspace
//   const handleOtpKeyDown = (index, e) => {
//     if (e.key === 'Backspace' && !otp[index] && index > 0) {
//       otpInputs.current[index - 1]?.focus();
//     }
//   };

//   // Send OTP
//   const handleSendOTP = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       // First verify credentials
//       const response = await apiLogin(formData);
      
//       // If login successful, send OTP
//       const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
//       await axios.post(`${API_URL}/otp/send`, {
//         email: formData.email,
//         purpose: 'login'
//       });

//       // Store user data temporarily
//       // sessionStorage.setItem('tempUser', JSON.stringify(response.data.user));
//       // sessionStorage.setItem('tempToken', response.data.token);



//       setShowOTP(true);
//       setResendTimer(60);
//       setTimeout(() => otpInputs.current[0]?.focus(), 100);
//     } catch (error) {
//       setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Verify OTP
//   const handleVerifyOTP = async (otpCode) => {
//     setOtpLoading(true);
//     setError('');

//     try {
//       const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
//       await axios.post(`${API_URL}/otp/verify`, {
//         email: formData.email,
//         otp: otpCode,
//         purpose: 'login'
//       });

//       // OTP verified, complete login
//       const tempUser = JSON.parse(sessionStorage.getItem('tempUser'));
//       const tempToken = sessionStorage.getItem('tempToken');

//       login(tempUser, tempToken);
//       sessionStorage.setItem("user", JSON.stringify(tempUser));
//       sessionStorage.setItem("token", tempToken);

//       // Clean up temp storage
//       sessionStorage.removeItem('tempUser');
//       sessionStorage.removeItem('tempToken');

//       // Redirect based on user role
//       if (tempUser.role === 'super_admin') {
//         navigate('/super-admin/dashboard');
//       } else {
//         navigate("/dashboard");
//       }
//     } catch (error) {
//       setError(error.response?.data?.message || 'Invalid OTP. Please try again.');
//       setOtp(['', '', '', '', '', '']);
//       otpInputs.current[0]?.focus();
//     } finally {
//       setOtpLoading(false);
//     }
//   };

//   // Resend OTP
//   const handleResendOTP = async () => {
//     setError('');
//     try {
//       const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
//       await axios.post(`${API_URL}/otp/send`, {
//         email: formData.email,
//         purpose: 'login'
//       });
//       setResendTimer(60);
//       setOtp(['', '', '', '', '', '']);
//       otpInputs.current[0]?.focus();
//     } catch (error) {
//       setError(error.response?.data?.message || 'Failed to resend OTP.');
//     }
//   };

//   const handleSubmit = showOTP ? (e) => {
//     e.preventDefault();
//     const otpCode = otp.join('');
//     if (otpCode.length === 6) {
//       handleVerifyOTP(otpCode);
//     }
//   } : handleSendOTP;

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100">
//       <div className="max-w-md w-full mx-4">
//         <div className="bg-white shadow-2xl rounded-2xl p-8 border-t-4 border-orange-500">
          
//           {/* Header with Logo */}
//           <div className="text-center mb-8">
//             <div className="mx-auto mb-6 flex justify-center">
//               <Logo size="lg" />
//             </div>
//             <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
//             <p className="text-gray-600 mt-1">Sign in to your BameeTech account</p>
//           </div>

//           {error && (
//             <div className="alert alert-error mb-6">
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-6">
//             {!showOTP ? (
//               <>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
//                     Email address
//                   </label>
//                   <input
//                     type="email"
//                     id="email"
//                     name="email"
//                     className="input"
//                     placeholder="Enter your email"
//                     value={formData.email}
//                     onChange={handleChange}
//                     required
//                   />
//                 </div>

//             {/* Password + Eye Toggle */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Password
//               </label>
//               <div className="relative">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   name="password"
//                   className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-12 focus:ring-2 focus:ring-blue-500 outline-none"
//                   placeholder="Enter your password"
//                   value={formData.password}
//                   onChange={handleChange}
//                   required
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
//                 >
//                   {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                 </button>
//               </div>
//             </div>

//                 <button
//                   type="submit"
//                   className="w-full py-3 text-base bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-600 transition-all shadow-lg disabled:opacity-50"
//                   disabled={loading}
//                 >
//                   {loading ? (
//                     <div className="flex items-center justify-center">
//                       <div className="loading-spinner mr-2"></div>
//                       Verifying credentials...
//                     </div>
//                   ) : (
//                     'Continue'
//                   )}
//                 </button>
//               </>
//             ) : (
//               <>
//                 <div className="text-center mb-6">
//                   <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
//                     <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                     </svg>
//                   </div>
//                   <h2 className="text-xl font-bold text-gray-900 mb-2">Verify your email</h2>
//                   <p className="text-gray-600 text-sm">
//                     We've sent a 6-digit code to<br />
//                     <span className="font-medium text-gray-900">{formData.email}</span>
//                   </p>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
//                     Enter verification code
//                   </label>
//                   <div className="flex justify-center gap-2 mb-4">
//                     {otp.map((digit, index) => (
//                       <input
//                         key={index}
//                         ref={(el) => (otpInputs.current[index] = el)}
//                         type="text"
//                         inputMode="numeric"
//                         maxLength={1}
//                         className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
//                         value={digit}
//                         onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
//                         onKeyDown={(e) => handleOtpKeyDown(index, e)}
//                         disabled={otpLoading}
//                       />
//                     ))}
//                   </div>
//                 </div>

//                 <button
//                   type="submit"
//                   className="w-full py-3 text-base bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-600 transition-all shadow-lg disabled:opacity-50"
//                   disabled={otpLoading || otp.some(digit => !digit)}
//                 >
//                   {otpLoading ? (
//                     <div className="flex items-center justify-center">
//                       <div className="loading-spinner mr-2"></div>
//                       Verifying...
//                     </div>
//                   ) : (
//                     'Verify & Sign in'
//                   )}
//                 </button>

//                 <div className="text-center">
//                   {resendTimer > 0 ? (
//                     <p className="text-sm text-gray-600">
//                       Resend code in <span className="font-medium text-blue-600">{resendTimer}s</span>
//                     </p>
//                   ) : (
//                     <button
//                       type="button"
//                       onClick={handleResendOTP}
//                       className="text-sm text-blue-600 hover:text-blue-700 font-medium"
//                     >
//                       Resend verification code
//                     </button>
//                   )}
//                 </div>

//                 <button
//                   type="button"
//                   onClick={() => {
//                     setShowOTP(false);
//                     setOtp(['', '', '', '', '', '']);
//                     setError('');
//                   }}
//                   className="text-sm text-gray-600 hover:text-gray-700 w-full text-center"
//                 >
//                   ← Back to login
//                 </button>
//               </>
//             )}
//           </form>

//           {/* Footer Links */}
//           <div className="mt-6 text-center space-y-2">
//             <p className="text-gray-600">
//               Don't have an account?{" "}
//               <Link to="/register" className="text-blue-600 font-medium hover:underline">
//                 Create account
//               </Link>
//             </p>
//             {/* <p className="text-sm text-gray-500 pt-2 border-t">
//               BameeTech Administrator?{" "}
//               <Link to="/admin-login" className="text-purple-600 font-medium hover:underline">
//                 Admin Login
//               </Link>
//             </p> */}
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;


import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as apiLogin } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import Logo from "../components/Logo";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showOTP, setShowOTP] = useState(false);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const otpInputs = useRef([]);
  const navigate = useNavigate();
  const { login } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // AUTO LOGIN IF TOKEN EXISTS
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");

    if (savedUser && savedToken) {
      const user = JSON.parse(savedUser);
      navigate(user.role === "super_admin" ? "/super-admin/dashboard" : "/dashboard");
    }
  }, []);

  // OTP TIMER
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleOtpChange = (index, value) => {
    value = value.replace(/\D/g, "").slice(0, 1);

    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    if (value && index < 5) otpInputs.current[index + 1]?.focus();
    if (updated.every((v) => v !== "")) handleVerifyOTP(updated.join(""));
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      otpInputs.current[index - 1]?.focus();
  };

  // STEP 1: CHECK CREDENTIALS + SEND OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiLogin(formData);

      // Save temporary user + token
      sessionStorage.setItem("tempUser", JSON.stringify(response.data.user));
      sessionStorage.setItem("tempToken", response.data.token);

      await axios.post(`${API_URL}/otp/send`, {
        email: formData.email,
        purpose: "login",
      });

      setShowOTP(true);
      setResendTimer(60);

      setTimeout(() => otpInputs.current[0]?.focus(), 200);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid login credentials.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: VERIFY OTP + FINAL LOGIN
  const handleVerifyOTP = async (otpCode) => {
    setOtpLoading(true);
    setError("");

    try {
      await axios.post(`${API_URL}/otp/verify`, {
        email: formData.email,
        otp: otpCode,
        purpose: "login",
      });

      const tempUser = JSON.parse(sessionStorage.getItem("tempUser"));
      const tempToken = sessionStorage.getItem("tempToken");

      // FINAL LOGIN (persistent)
      localStorage.setItem("user", JSON.stringify(tempUser));
      localStorage.setItem("token", tempToken);

      login(tempUser, tempToken);

      sessionStorage.removeItem("tempUser");
      sessionStorage.removeItem("tempToken");

      navigate(
        tempUser.role === "super_admin"
          ? "/super-admin/dashboard"
          : "/dashboard"
      );
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP.");
      setOtp(["", "", "", "", "", ""]);
      otpInputs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await axios.post(`${API_URL}/otp/send`, {
        email: formData.email,
        purpose: "login",
      });

      setOtp(["", "", "", "", "", ""]);
      setResendTimer(60);
      otpInputs.current[0]?.focus();
    } catch {
      setError("Failed to resend OTP.");
    }
  };

  const handleSubmit = showOTP
    ? (e) => {
        e.preventDefault();
        const code = otp.join("");
        if (code.length === 6) handleVerifyOTP(code);
      }
    : handleSendOTP;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white shadow-2xl rounded-2xl p-8 border-t-4 border-orange-500">

          {/* HEADER */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-6 flex justify-center">
              <Logo size="lg" />
            </div>
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your BameeTech account</p>
          </div>

          {error && <div className="alert alert-error mb-6">{error}</div>}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {!showOTP ? (
              <>
                {/* Email */}
                <div>
                  <label className="block text-sm mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className="input"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="input pr-12"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-2.5 text-gray-600"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                 <button
                  type="submit"
                  className="w-full py-3 text-base bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-600 transition-all shadow-lg disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="loading-spinner mr-2"></div>
                      Verifying credentials...
                    </div>
                  ) : (
                    'Continue'
                  )}
                </button>
              </>
            ) : (
              <>
                {/* OTP UI */}
                <div className="text-center mb-6">
                  <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 text-3xl">
                    📩
                  </div>
                  <h2 className="text-xl font-bold">Verify your email</h2>
                  <p className="text-gray-600 text-sm">
                    Code sent to <b>{formData.email}</b>
                  </p>
                </div>

                {/* OTP BOXES */}
                <div className="flex justify-center gap-2 mb-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="w-12 h-12 text-xl text-center font-bold border-2 rounded-lg"
                      value={digit}
                      disabled={otpLoading}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    />
                  ))}
                </div>

                <button
                  className="btn-primary w-full m-3"
                  disabled={otpLoading || otp.some((d) => !d)}
                >
                  {otpLoading ? "Verifying..." : "Verify & Sign In"}
                </button>

                {/* RESEND */}
                <div className="text-center mt-2">
                  {resendTimer > 0 ? (
                    <p className="text-sm">
                      Resend in <b>{resendTimer}s</b>
                    </p>
                  ) : (
                    <button className="text-blue-600" type="button" onClick={handleResendOTP}>
                      Resend Code
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowOTP(false);
                    setOtp(["", "", "", "", "", ""]);
                    setError("");
                  }}
                  className="text-sm text-gray-600 w-full text-center mt-2"
                >
                  ← Back to login
                </button>
              </>
            )}
          </form>

          {/* FOOTER */}
          <div className="text-center mt-6 space-y-3">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-600 font-medium hover:underline">
                Create account
              </Link>
            </p>
            <p className="text-gray-600">
              <Link to="/forgot-password" className="text-orange-600 font-medium hover:underline">
                Forgot your password?
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;

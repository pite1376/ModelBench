import React, { useState } from 'react';
import { X, Phone, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/store';
import { useTranslation } from '@/utils/translations';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { language, login, register } = useAppStore();
  const t = useTranslation(language);
  
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePhone = (phone: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validatePhone(phone)) {
      setError(t.auth.invalidPhone);
      return;
    }
    
    if (!verificationCode) {
      setError(t.auth.invalidCode);
      return;
    }
    
    setIsLoading(true);
    
    try {
      let success = false;
      
      if (isLogin) {
        success = await login(phone, verificationCode);
        if (!success) {
          setError(t.auth.userNotExists);
        }
      } else {
        success = await register(phone, verificationCode);
        if (!success) {
          setError(t.auth.userExists);
        }
      }
      
      if (success) {
        onSuccess();
        onClose();
        // 清空表单
        setPhone('');
        setVerificationCode('');
      }
    } catch (err) {
      setError(isLogin ? t.auth.loginFailed : t.auth.registerFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setPhone('');
    setVerificationCode('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isLogin ? t.auth.loginTitle : t.auth.registerTitle}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 手机号输入 */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              {t.auth.phoneLabel}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone size={18} className="text-gray-400" />
              </div>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.auth.phonePlaceholder}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          {/* 验证码输入 */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              {t.auth.verificationCodeLabel}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MessageSquare size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder={t.auth.verificationCodePlaceholder}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">{t.auth.verificationCodeHint}</p>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white font-medium py-3 px-6 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <span>{isLogin ? t.auth.loginButton : t.auth.registerButton}</span>
            )}
          </button>

          {/* 切换模式 */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {isLogin ? t.auth.switchToRegister : t.auth.switchToLogin}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 
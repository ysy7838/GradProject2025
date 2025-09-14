// src/components/common/ProfileDropdown.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRecoilState } from "recoil";
import { userProfileState } from "@/store/user";
import { userService } from "@/services/user";

const ProfileDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [userProfile, setUserProfile] = useRecoilState(userProfileState);
  const [isLoading, setIsLoading] = useState(true);

  // 프로필 정보 로드
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const profileData = await userService.getMyProfile();
        setUserProfile(profileData);
      } catch (error) {
        console.error("프로필 정보 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [location.pathname, setUserProfile]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 마이페이지로 이동
  const handleMyPageClick = () => {
    navigate("/mypage");
    setIsOpen(false);
  };

  // 로그아웃 처리
  const handleLogoutClick = async () => {
    await logout();
    setUserProfile(null);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden hover:ring-2 hover:ring-primary transition-all duration-200"
      >
        {isLoading ? (
          <div className="w-full h-full bg-gray-200 animate-pulse rounded-full"></div>
        ) : userProfile?.profileImage ? (
          <img
            src={userProfile.profileImage}
            alt="프로필"
            className="w-full h-full object-cover"
            onError={(e) => {
              // 이미지 로드 실패 시 기본 이미지로 대체
              (e.target as HTMLImageElement).src =
                "/images/default-profile.svg";
            }}
          />
        ) : (
          <User className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {isOpen && (
        <div className="absolute w-[164px] h-[94px] top-[48px] left-[-108px] rounded-[16px] shadow-lg bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border z-20">
          <div className="py-0 flex flex-col justify-center h-full">
            <button
              onClick={handleMyPageClick}
              className="flex items-center justify-center w-full px-4 py-3 text-sm text-gray-700 dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-hover"
            >
              <User className="mr-2 h-4 w-4" />
              마이페이지
            </button>
            <button
              onClick={handleLogoutClick}
              className="flex items-center justify-center w-full px-4 py-3 text-sm text-gray-700 dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-hover"
            >
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;

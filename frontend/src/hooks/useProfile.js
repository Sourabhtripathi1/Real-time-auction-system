import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import {
  getProfile,
  updateProfile,
  changePassword,
  removeProfileImage,
} from "../services/profileApi";

const useProfile = () => {
  const { updateProfileImage, updateUserName } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getProfile();
      setProfile(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateProfile = useCallback(
    async (formData) => {
      setUpdating(true);
      try {
        const res = await updateProfile(formData);
        const updatedUser = res.data?.user;
        setProfile((prev) => ({ ...prev, user: updatedUser }));

        // Sync avatar + name in navbar immediately
        if (updatedUser?.profileImage?.url !== undefined) {
          updateProfileImage(updatedUser.profileImage?.url || null);
        }
        if (updatedUser?.name) {
          updateUserName(updatedUser.name);
        }

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.message || "Update failed",
        };
      } finally {
        setUpdating(false);
      }
    },
    [updateProfileImage, updateUserName],
  );

  const handleChangePassword = useCallback(async (data) => {
    setPasswordLoading(true);
    try {
      await changePassword(data);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "Password change failed",
      };
    } finally {
      setPasswordLoading(false);
    }
  }, []);

  const handleRemoveImage = useCallback(async () => {
    try {
      const res = await removeProfileImage();
      const updatedUser = res.data?.user;
      setProfile((prev) => ({
        ...prev,
        user: {
          ...prev?.user,
          profileImage: null,
          profileCompletion:
            updatedUser?.profileCompletion ?? prev?.user?.profileCompletion,
        },
      }));
      updateProfileImage(null);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "Failed to remove image",
      };
    }
  }, [updateProfileImage]);

  return {
    profile,
    loading,
    error,
    updating,
    passwordLoading,
    fetchProfile,
    handleUpdateProfile,
    handleChangePassword,
    handleRemoveImage,
  };
};

export default useProfile;

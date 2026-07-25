import React, { createContext, useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import * as locationsApi from "../services/api/locations";
import * as usersApi from "../services/api/user";
import * as apiKeysApi from "../services/api/apiKeys";
import * as authProvidersApi from "../services/api/authProviders";

export const UserContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const UserProvider = ({ children }) => {
  const { user, accessToken, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [savedCities, setSavedCities] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [authProviders, setAuthProviders] = useState([]);
  const [loadingSavedCities, setLoadingSavedCities] = useState(true);

  useEffect(() => {
    if (user && accessToken) {
      setProfile(user);
      loadSavedCities();
      loadApiKeys();
      loadAuthProviders();
    } else {
      setProfile(null);
      setSavedCities([]);
      setApiKeys([]);
      setAuthProviders([]);
      setLoadingSavedCities(false);
    }
  }, [user, accessToken]);

  const loadSavedCities = async () => {
    if (!accessToken) {
      setLoadingSavedCities(false);
      return;
    }
    setLoadingSavedCities(true);
    try {
      const locations = await locationsApi.getSavedLocations();
      setSavedCities(Array.isArray(locations) ? locations : []);
    } catch (err) {
      setSavedCities([]);
    } finally {
      setLoadingSavedCities(false);
    }
  };

  const addCity = async (cityObject) => {
    if (!accessToken || !user) {
      console.warn("No access token or user, cannot add city");
      return;
    }
    const alreadyExists = savedCities.some((city) => {
      if (cityObject.lat && cityObject.lon) {
        return (
          Math.abs(city.latitude - cityObject.lat) < 0.001 &&
          Math.abs(city.longitude - cityObject.lon) < 0.001
        );
      }
      return (
        city.location_name === cityObject.name &&
        city.country === cityObject.country
      );
    });
    if (alreadyExists) {
      alert("Город уже в списке");
      return;
    }
    try {
      const newLocation = await locationsApi.addLocation({
        user_id: user.id,
        location_name: cityObject.name,
        country: cityObject.country || "",
        latitude: cityObject.lat,
        longitude: cityObject.lon,
        timezone_offset: cityObject.timezone_offset || 0,
        custom_name: null,
        note: null,
        display_order: savedCities.length,
      });
      setSavedCities((prev) => [...prev, newLocation]);
    } catch (err) {
      console.error("Failed to add city:", err);
      alert("Ошибка при сохранении города");
    }
  };

  const removeCity = async (locationId) => {
    if (!accessToken) return;
    try {
      await locationsApi.deleteLocation(locationId);
      setSavedCities((prev) => prev.filter((city) => city.id !== locationId));
    } catch (err) {
      console.error("Failed to delete city:", err);
      alert("Не удалось удалить город. Проверьте авторизацию.");
    }
  };

  const reorderCities = async (newOrder) => {
    if (!accessToken) return;
    try {
      const updated = await locationsApi.reorderLocations(newOrder);
      setSavedCities(updated);
    } catch (err) {
      console.error("Failed to reorder cities:", err);
    }
  };

  const updateProfile = async (updates) => {
    if (!accessToken) throw new Error("Not authenticated");
    try {
      const updatedUser = await usersApi.updateProfile(updates);
      setProfile((prev) => ({ ...prev, ...updatedUser }));
      if (refreshUser) await refreshUser();
      return updatedUser;
    } catch (err) {
      console.error("Failed to update profile:", err);
      throw err;
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    if (!accessToken) throw new Error("Not authenticated");
    try {
      await usersApi.changePassword(oldPassword, newPassword);
    } catch (err) {
      console.error("Failed to change password:", err);
      throw err;
    }
  };

  const deactivateAccount = async () => {
    if (!accessToken) throw new Error("Not authenticated");
    try {
      await usersApi.deactivateAccount();
    } catch (err) {
      console.error("Failed to deactivate account:", err);
      throw err;
    }
  };

  const loadApiKeys = async () => {
    if (!accessToken) return;
    try {
      const keys = await apiKeysApi.getApiKeys();
      setApiKeys(keys);
    } catch (err) {
      console.error("Failed to load API keys:", err);
    }
  };

  const addApiKey = async (keyData) => {
    if (!accessToken || !user) throw new Error("Not authenticated");
    const newKey = await apiKeysApi.addApiKey({
      user_id: user.id,
      ...keyData,
    });
    setApiKeys((prev) => [...prev, newKey]);
    return newKey;
  };

  const updateApiKey = async (keyId, updates) => {
    if (!accessToken) throw new Error("Not authenticated");
    const updated = await apiKeysApi.updateApiKey(keyId, updates);
    setApiKeys((prev) =>
      prev.map((key) => (key.id === keyId ? { ...key, ...updated } : key)),
    );
    return updated;
  };

  const deleteApiKey = async (keyId) => {
    if (!accessToken) throw new Error("Not authenticated");
    await apiKeysApi.deleteApiKey(keyId);
    setApiKeys((prev) => prev.filter((key) => key.id !== keyId));
  };

  const activateApiKey = async (keyId) => {
    if (!accessToken) throw new Error("Not authenticated");
    await apiKeysApi.activateApiKey(keyId);
    setApiKeys((prev) =>
      prev.map((key) => (key.id === keyId ? { ...key, is_active: true } : key)),
    );
  };

  const deactivateApiKey = async (keyId) => {
    if (!accessToken) throw new Error("Not authenticated");
    await apiKeysApi.deactivateApiKey(keyId);
    setApiKeys((prev) =>
      prev.map((key) =>
        key.id === keyId ? { ...key, is_active: false } : key,
      ),
    );
  };

  const decryptApiKey = async (keyId) => {
    if (!accessToken) throw new Error("Not authenticated");
    return apiKeysApi.decryptApiKey(keyId);
  };

  const loadAuthProviders = async () => {
    if (!accessToken) return;
    try {
      const providers = await authProvidersApi.getProviders();
      setAuthProviders(providers);
    } catch (err) {
      console.error("Failed to load auth providers:", err);
    }
  };

  const unlinkProvider = async (authId) => {
    if (!accessToken) throw new Error("Not authenticated");
    await authProvidersApi.deleteProvider(authId);
    setAuthProviders((prev) => prev.filter((p) => p.id !== authId));
  };

  const linkGitHub = () => {
    window.location.href = `${API_BASE_URL}/auth/oauth/github/login`;
  };

  return (
    <UserContext.Provider
      value={{
        profile,
        savedCities,
        apiKeys,
        authProviders,
        loadingSavedCities,
        updateProfile,
        addCity,
        removeCity,
        reorderCities,
        changePassword,
        deactivateAccount,
        reloadCities: loadSavedCities,
        addApiKey,
        updateApiKey,
        deleteApiKey,
        activateApiKey,
        deactivateApiKey,
        decryptApiKey,
        loadApiKeys,
        loadAuthProviders,
        unlinkProvider,
        linkGitHub,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function UserProfilePage() {
  const { user: currentUser, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated) {
        router.push?.("/login");
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Профиль не найден");
        }

        const data = await response.json();
        setName(data.user.name || "");
        setEmail(data.user.email || "");
      } catch (err) {
        setMessage(
          err instanceof Error ? err.message : "Ошибка загрузки профиля"
        );
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, userId]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Ошибка обновления профиля");

      setMessage("Профиль успешно обновлен!");
      setIsEditing(false);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Ошибка обновления профиля"
      );
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!currentPassword || !newPassword) {
      setMessage("Заполните все поля пароля");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/users/${userId}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Ошибка изменения пароля");

      setMessage("Пароль успешно изменен!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Ошибка изменения пароля"
      );
    }
  };

  if (isLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-zinc-300 border-t-blue-600"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Заголовок */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Мой профиль
            </h1>
            <Link
              href="/"
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 rounded-lg font-medium transition-colors"
            >
              На главную
            </Link>
          </div>

          {message && (
            <div
              className={`mb-4 px-4 py-3 rounded-lg ${
                message.includes("успешно")
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
              }`}
            >
              {message}
            </div>
          )}

          {/* Информация о пользователе */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {name?.[0] || currentUser?.username?.[0].toUpperCase() || "?"}
                </span>
              </div>
              <div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {name || currentUser?.username}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {currentUser?.username}
                </div>
              </div>
            </div>

            {!isEditing ? (
              <div className="space-y-3 pt-4">
                <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-600 dark:text-zinc-400">Имя:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {name || "Не указано"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Логин:
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {currentUser?.username}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Email:
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {email}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Зарегистрирован:
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {currentUser?.createdAt
                      ? new Date(currentUser.createdAt).toLocaleDateString(
                          "ru-RU"
                        )
                      : "N/A"}
                  </span>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Редактировать профиль
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Имя
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-6 py-3 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 rounded-lg font-medium transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Изменение пароля */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
            Изменить пароль
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Текущий пароль
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Новый пароль
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Изменить пароль
            </button>
          </form>
        </div>

        {/* Опасная зона */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6 border-2 border-red-200 dark:border-red-800">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
            Опасная зона
          </h2>
          <div className="space-y-4">
            <button
              onClick={logout}
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Выйти из аккаунта
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import PageContainer from "@/components/layout/PageContainer";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/useToast";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import Input from "@/components/ui/forms/Input";
import TextArea from "@/components/ui/forms/TextArea";
import Card from "@/components/ui/cards/Card";
import IconButton from "@/components/ui/buttons/IconButton";
import { useTheme } from "next-themes";

export default function ProfilePage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const { showToast } = useToast();
  const nameRef = useRef("");
  const bioRef = useRef("");

  useEffect(() => {
    if (session?.user?.name) {
      nameRef.current = session.user.name;
      setName(session.user.name);
    }
    const userBio = (session?.user as any)?.bio;
    if (userBio) {
      bioRef.current = userBio;
      setBio(userBio);
    }
  }, [session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/profile', { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ name, bio }) 
      });
      if (res.ok) {
        showToast('Profil diperbarui', 'success');
        setEditing(false);
      } else {
        showToast('Gagal memperbarui profil', 'error');
      }
    } catch (err) { 
      showToast('Kesalahan jaringan', 'error'); 
    }
  };

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      window.location.href = '/api/auth/signout';
    }
  };

  return (
    <ProtectedRoute>
      <PageContainer>
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-1">
            Profile
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your account settings
          </p>
        </div>

        <Card>
          {!editing ? (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-4xl text-white font-bold shadow-medium">
                  {session?.user?.name?.charAt(0) || 'U'}
                </div>
                <div className="absolute bottom-0 right-0">
                  <IconButton icon="📷" size="sm" variant="secondary" label="Change avatar" />
                </div>
              </div>

              <div className="flex-1 w-full space-y-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Name</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                    {session?.user?.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Email</div>
                  <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    {session?.user?.email}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">User ID</div>
                  <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    {session?.user?.id}
                  </div>
                </div>
                {bio && (
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Bio</div>
                    <div className="text-base text-gray-700 dark:text-gray-300">
                      {bio}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 w-full">
                <PrimaryButton onClick={() => setEditing(true)} fullWidth>
                  Edit Profile
                </PrimaryButton>
                <SecondaryButton onClick={handleLogout} fullWidth className="text-error-600 hover:bg-error-50">
                  Logout
                </SecondaryButton>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6 py-8">
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-4xl text-white font-bold shadow-medium">
                  {name?.charAt(0) || 'U'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Avatar preview
                </div>
              </div>

              <div className="space-y-4">
                <Input label="Name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
                <TextArea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} />
              </div>

              <div className="flex gap-3">
                <PrimaryButton type="submit" fullWidth>
                  Save Changes
                </PrimaryButton>
                <SecondaryButton type="button" onClick={() => setEditing(false)} fullWidth>
                  Cancel
                </SecondaryButton>
              </div>
            </form>
          )}
        </Card>

        <Card title="Settings" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Theme</div>
                <div className="text-base font-medium text-gray-900 dark:text-dark-text-primary">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </div>
              </div>
              <IconButton icon={theme === 'dark' ? '☀️' : '🌙'} size="lg" variant="secondary" label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Notifications</div>
                <div className="text-base font-medium text-gray-900 dark:text-dark-text-primary">
                  Enabled
                </div>
              </div>
              <div className="w-12 h-6 bg-success-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                  <span className="text-success-500 text-xs">✓</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Privacy</div>
                <div className="text-base font-medium text-gray-900 dark:text-dark-text-primary">
                  Public Profile
                </div>
              </div>
              <IconButton icon="🔒" size="lg" variant="secondary" label="Privacy settings" />
            </div>
          </div>
        </Card>
      </PageContainer>
    </ProtectedRoute>
  );
}

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { settingsService } from '../services/services';
import { Lock, Phone, Image, Trash2, LogOut, CheckCircle, AlertCircle } from 'lucide-react';

const SettingsPage: React.FC = () => {
    const { state, logout } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Password change state
    const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [pwLoading, setPwLoading] = useState(false);

    // Profile update state
    const [phone, setPhone] = useState(state.user?.rollOrId ? '' : '');
    const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // Avatar state
    const [avatarPreview, setAvatarPreview] = useState<string>(state.user?.rollOrId ? '' : '');
    const [avatarMsg, setAvatarMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Delete account state
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleteMsg, setDeleteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwMsg(null);
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            setPwMsg({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        if (pwForm.newPassword.length < 6) {
            setPwMsg({ type: 'error', text: 'New password must be at least 6 characters' });
            return;
        }
        setPwLoading(true);
        try {
            await settingsService.changePassword({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword });
            setPwMsg({ type: 'success', text: 'Password changed successfully!' });
            setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: unknown) {
            setPwMsg({ type: 'error', text: (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to change password' });
        } finally {
            setPwLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMsg(null);
        if (!phone.trim()) { setProfileMsg({ type: 'error', text: 'Phone number is required' }); return; }
        setProfileLoading(true);
        try {
            await settingsService.updateProfile({ phone });
            setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err: unknown) {
            setProfileMsg({ type: 'error', text: (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update profile' });
        } finally {
            setProfileLoading(false);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { setAvatarMsg({ type: 'error', text: 'Image must be under 2MB' }); return; }
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            setAvatarPreview(base64);
            try {
                await settingsService.updateProfile({ profileImage: base64 });
                setAvatarMsg({ type: 'success', text: 'Profile image updated!' });
            } catch {
                setAvatarMsg({ type: 'error', text: 'Failed to update image' });
            }
        };
        reader.readAsDataURL(file);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setDeleteMsg(null);
        if (!deletePassword) { setDeleteMsg({ type: 'error', text: 'Password is required' }); return; }
        try {
            await settingsService.deleteAccount({ password: deletePassword });
            logout();
            navigate('/');
        } catch (err: unknown) {
            setDeleteMsg({ type: 'error', text: (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to delete account' });
        }
    };

    const Msg = ({ msg }: { msg: { type: 'success' | 'error'; text: string } | null }) => {
        if (!msg) return null;
        return (
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem',
                borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem',
                background: msg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                color: msg.type === 'success' ? '#16A34A' : '#DC2626',
                border: `1px solid ${msg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
            }}>
                {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {msg.text}
            </div>
        );
    };

    const initials = (state.user?.username || 'U').substring(0, 2).toUpperCase();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Profile Image Section */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title"><Image size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />Profile Image</span>
                </div>
                <Msg msg={avatarMsg} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%', background: avatarPreview ? 'transparent' : 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem', fontWeight: 700, color: 'white', overflow: 'hidden', flexShrink: 0,
                    }}>
                        {avatarPreview
                            ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : initials}
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                            {state.user?.username} · {state.user?.role}
                        </p>
                        <button className="btn btn-outline btn-sm" style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}
                            onClick={() => fileInputRef.current?.click()}>
                            Upload Image
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>JPEG/PNG, max 2MB</p>
                    </div>
                </div>
            </div>

            {/* Edit Profile Section */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title"><Phone size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />Edit Profile</span>
                </div>
                <Msg msg={profileMsg} />
                <form onSubmit={handleUpdateProfile} className="auth-form" style={{ maxWidth: 400 }}>
                    <div className="form-group">
                        <label>Phone Number</label>
                        <input
                            className="form-input"
                            placeholder="+91 XXXXX XXXXX"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                        {profileLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>

            {/* Change Password Section */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title"><Lock size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />Change Password</span>
                </div>
                <Msg msg={pwMsg} />
                <form onSubmit={handleChangePassword} className="auth-form" style={{ maxWidth: 400 }}>
                    <div className="form-group">
                        <label>Current Password</label>
                        <input type="password" className="form-input" placeholder="••••••••"
                            value={pwForm.oldPassword} onChange={e => setPwForm(f => ({ ...f, oldPassword: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                        <label>New Password</label>
                        <input type="password" className="form-input" placeholder="••••••••"
                            value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} required minLength={6} />
                    </div>
                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <input type="password" className="form-input" placeholder="••••••••"
                            value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} required minLength={6} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                        {pwLoading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </div>

            {/* Logout & Delete Section */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title">Account Actions</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button className="btn btn-outline" style={{ borderColor: 'var(--border)', color: 'var(--text)', width: 'fit-content', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={handleLogout}>
                        <LogOut size={16} /> Logout
                    </button>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                        <p style={{ color: '#DC2626', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Trash2 size={16} /> Delete Account
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            This action is permanent and cannot be undone. All your data will be deleted.
                        </p>
                        <Msg msg={deleteMsg} />
                        {!deleteConfirm ? (
                            <button className="btn btn-sm btn-outline"
                                style={{ borderColor: '#FECACA', color: '#DC2626', background: '#FEF2F2' }}
                                onClick={() => setDeleteConfirm(true)}>
                                Delete My Account
                            </button>
                        ) : (
                            <form onSubmit={handleDeleteAccount} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <input type="password" className="form-input" placeholder="Enter password to confirm"
                                    style={{ maxWidth: 260 }}
                                    value={deletePassword} onChange={e => setDeletePassword(e.target.value)} required />
                                <button type="submit" className="btn btn-sm btn-outline"
                                    style={{ borderColor: '#FECACA', color: '#DC2626', background: '#FEF2F2' }}>
                                    Confirm Delete
                                </button>
                                <button type="button" className="btn btn-sm btn-outline"
                                    style={{ borderColor: 'var(--border)' }}
                                    onClick={() => setDeleteConfirm(false)}>
                                    Cancel
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;

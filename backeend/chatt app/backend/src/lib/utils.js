import jwt from 'jsonwebtoken';

// ==================== JWT TOKEN FUNCTIONS ====================
export const generateToken = (userId, res) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "30d", // Extended to 30 days for better UX
    });

    // Cookie options
    const cookieOptions = {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/"
    };

    res.cookie("jwt", token, cookieOptions);
    return token;
};

export const verifyToken = (token) => {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        console.error('Token verification error:', error.message);
        return null;
    }
};

export const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        console.error('Token decode error:', error.message);
        return null;
    }
};

// ==================== VALIDATION FUNCTIONS ====================
export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validateUsername = (username) => {
    // Username: 3-30 characters, letters, numbers, underscores
    const re = /^[a-zA-Z0-9_]{3,30}$/;
    return re.test(username);
};

export const validatePassword = (password) => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return re.test(password);
};

export const validateFullName = (fullName) => {
    // 2-50 characters, allows letters, spaces, hyphens, apostrophes
    const re = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/;
    return re.test(fullName.trim());
};

// ==================== GENERATOR FUNCTIONS ====================
export const generateRandomCode = (length = 6, type = 'numeric') => {
    let chars;
    switch (type) {
        case 'alphanumeric':
            chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            break;
        case 'alphabetic':
            chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            break;
        case 'numeric':
        default:
            chars = "0123456789";
    }
    
    let code = "";
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

export const generateUniqueId = (prefix = '') => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${prefix}${timestamp}_${randomStr}`;
};

export const generateUsername = (fullName) => {
    const base = fullName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
    const random = Math.floor(Math.random() * 10000);
    return `${base}${random}`;
};

// ==================== DATE & TIME FUNCTIONS ====================
export const formatDate = (date) => {
    const now = new Date();
    const inputDate = new Date(date);
    const diff = now - inputDate;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (weeks < 4) return `${weeks}w ago`;
    if (months < 12) return `${months}mo ago`;
    return `${years}y ago`;
};

export const formatFullDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const getTimeDifference = (date1, date2) => {
    const diff = Math.abs(new Date(date1) - new Date(date2));
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return { days, hours: hours % 24, minutes: minutes % 60, seconds: seconds % 60 };
};

// ==================== STRING & TEXT FUNCTIONS ====================
export const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatNumber = (num) => {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
};

export const extractHashtags = (text) => {
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
};

export const extractMentions = (text) => {
    const mentionRegex = /@[\w\u0590-\u05ff]+/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(mention => mention.substring(1)) : [];
};

// ==================== FILE & MEDIA FUNCTIONS ====================
export const getFileExtension = (filename) => {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
};

export const isValidImage = (filename) => {
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const ext = getFileExtension(filename).toLowerCase();
    return validExtensions.includes(ext);
};

export const isValidVideo = (filename) => {
    const validExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
    const ext = getFileExtension(filename).toLowerCase();
    return validExtensions.includes(ext);
};

export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ==================== ARRAY & OBJECT FUNCTIONS ====================
export const removeDuplicates = (array) => {
    return [...new Set(array)];
};

export const sortByDate = (array, key = 'createdAt', order = 'desc') => {
    return array.sort((a, b) => {
        const dateA = new Date(a[key]);
        const dateB = new Date(b[key]);
        return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
};

export const groupBy = (array, key) => {
    return array.reduce((result, item) => {
        const groupKey = item[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
};

// ==================== SECURITY FUNCTIONS ====================
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

export const generateCSRFToken = () => {
    return generateRandomCode(32, 'alphanumeric');
};

// ==================== HELPER FUNCTIONS ====================
export const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export const isObjectEmpty = (obj) => {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
};

export const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

// Export everything
export default {
    generateToken,
    verifyToken,
    decodeToken,
    validateEmail,
    validateUsername,
    validatePassword,
    validateFullName,
    generateRandomCode,
    generateUniqueId,
    generateUsername,
    formatDate,
    formatFullDate,
    formatTime,
    getTimeDifference,
    truncateText,
    capitalizeFirst,
    formatNumber,
    extractHashtags,
    extractMentions,
    getFileExtension,
    isValidImage,
    isValidVideo,
    formatFileSize,
    removeDuplicates,
    sortByDate,
    groupBy,
    sanitizeInput,
    generateCSRFToken,
    delay,
    isObjectEmpty,
    deepClone
};
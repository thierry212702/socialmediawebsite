import { Toaster } from 'react-hot-toast';

const Toast = () => {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#363636',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '16px',
                },
                success: {
                    duration: 3000,
                    theme: {
                        primary: 'green',
                        secondary: 'black',
                    },
                    style: {
                        background: '#10b981',
                    },
                },
                error: {
                    duration: 4000,
                    style: {
                        background: '#ef4444',
                    },
                },
                loading: {
                    duration: Infinity,
                },
            }}
        />
    );
};

export default Toast;
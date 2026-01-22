import { Montserrat, Open_Sans } from 'next/font/google';
import './globals.css';
import Navbar from '../components/Navbar';
import { AuthProvider } from '@/components/AuthProvider';
import ErrorBoundary from '@/components/ErrorBoundary';

const montserrat = Montserrat({
    subsets: ['latin'],
    variable: '--font-montserrat',
    display: 'swap',
});

const openSans = Open_Sans({
    subsets: ['latin'],
    variable: '--font-open-sans',
    display: 'swap',
});

export const metadata = {
    title: "Dr Kal's Virtual Hospital",
    description: 'A secure online hospital platform.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${openSans.variable} ${montserrat.variable}`} suppressHydrationWarning={true}>
                <AuthProvider>
                    <Navbar />
                    <main className="main-content">
                        <ErrorBoundary>
                            {children}
                        </ErrorBoundary>
                    </main>
                </AuthProvider>
            </body>
        </html>
    );
}

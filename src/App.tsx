import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { InsforgeProvider } from '@insforge/react';
import { insforge } from '@/lib/insforge';
import { RoleProvider } from '@/context/RoleContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import AppRoutes from '@/routes/AppRoutes';
import MaintenanceGuard from '@/components/guards/MaintenanceGuard';

export default function App() {
    return (
        <ThemeProvider>
            <InsforgeProvider client={insforge}>
                <TooltipProvider>
                    <MaintenanceGuard>
                        <RoleProvider>
                            <BrowserRouter>
                                <AppRoutes />
                            </BrowserRouter>
                        </RoleProvider>
                    </MaintenanceGuard>
                </TooltipProvider>
            </InsforgeProvider>
        </ThemeProvider>
    );
}

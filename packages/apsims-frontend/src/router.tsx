import { createBrowserRouter } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import NotFound from './pages/NotFound';
import RequireAuth from './components/RequireAuth';

// Module Placeholders
import ExamsModule from './pages/modules/ExamsModule';
import FeesModule from './pages/modules/FeesModule';
import IncomeModule from './pages/modules/IncomeModule';
import TimetableModule from './pages/modules/TimetableModule';
import RemedialModule from './pages/modules/RemedialModule';
import PocketMoneyModule from './pages/modules/PocketMoneyModule';
import StaffModule from './pages/modules/StaffModule';
import SubordinateStaffModule from './pages/modules/SubordinateStaffModule';
import StudentsModule from './pages/modules/StudentsModule';

const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <RequireAuth>
                <DashboardLayout />
            </RequireAuth>
        ),
        errorElement: <NotFound />,
        children: [
            {
                index: true,
                element: <DashboardHome />,
            },
            {
                path: 'students',
                element: <StudentsModule />,
            },
            {
                path: 'exams',
                element: <ExamsModule />,
            },
            {
                path: 'fees',
                element: <FeesModule />,
            },
            {
                path: 'income',
                element: <IncomeModule />,
            },
            {
                path: 'timetable',
                element: <TimetableModule />,
            },
            {
                path: 'remedial',
                element: <RemedialModule />,
            },
            {
                path: 'pocket-money',
                element: <PocketMoneyModule />,
            },
            {
                path: 'staff',
                element: <StaffModule />,
            },
            {
                path: 'subordinate-staff',
                element: <SubordinateStaffModule />,
            },
        ],
    },
    {
        path: '/login',
        element: <Login />,
    },
]);

export default router;

import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/app-layout'
import NotMatch from './pages/NotMatch'
import Dashboard from './pages/Dashboard'
import Sample from './pages/Sample'
import ComingSoon from './pages/ComingSoon'
import EpisodeDetail from './pages/EpisodeDetail'
import RegistrationForm from './pages/RegistrationForm'
import LoginForm from './pages/LoginForm'

export default function Router() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route path="" element={<Dashboard />} />
                <Route path='login' element={<LoginForm />}></Route>
                <Route path="register" element={<RegistrationForm />} />
                <Route path="episodes/:slug" element={<EpisodeDetail />} /> 
                <Route path="pages">
                    <Route path="sample" element={<Sample />} />
                    <Route path="feature" element={<ComingSoon />} />
                </Route>
                <Route path="*" element={<NotMatch />} />
            </Route>
        </Routes>
    )
}

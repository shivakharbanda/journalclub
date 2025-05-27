import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, User, Lock, BookOpen, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginForm() {
    const navigate = useNavigate()
    const location = useLocation()
    const { login } = useAuth()

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    useEffect(() => {
        if (location.state?.message) {
            setSuccessMessage(location.state.message)
            window.history.replaceState({}, document.title)
        }
    }, [location.state])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }

        if (successMessage) {
            setSuccessMessage('')
        }
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required'
        }

        if (!formData.password) {
            newErrors.password = 'Password is required'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsLoading(true)
        setErrors({})
        try {
            await login(formData.username, formData.password)
            navigate("/", { replace: true })
        } catch (err: any) {
            setErrors({ general: err.message || "Login failed" })
        } finally {
            setIsLoading(false)
        }
    }


    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex items-center justify-center mb-4">
                        <div className="flex items-center space-x-2">
                            <BookOpen className="h-8 w-8 text-primary" />
                            <span className="text-2xl font-bold text-primary">JournalClub</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
                    <CardDescription>
                        Sign in to your account to continue exploring research
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {successMessage && (
                            <Alert className="border-green-200 bg-green-50 text-green-800">
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>{successMessage}</AlertDescription>
                            </Alert>
                        )}

                        {errors.general && (
                            <Alert variant="destructive">
                                <AlertDescription>{errors.general}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="username"
                                    name="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className={`pl-10 ${errors.username ? 'border-destructive' : ''}`}
                                    autoComplete="username"
                                />
                            </div>
                            {errors.username && (
                                <p className="text-sm text-destructive">{errors.username}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-muted-foreground">Don't have an account? </span>
                        <Link to="/register" className="text-primary hover:underline">
                            Create account
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

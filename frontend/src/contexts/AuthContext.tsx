import { fetcher } from "@/lib/api"
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"

type AuthContextType = {
	isAuthenticated: boolean
	login: (username: string, password: string) => Promise<void>
	logout: () => void
	accessToken: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
	const navigate = useNavigate()

	useEffect(() => {
		// simple check — can be replaced with `/user/me/` endpoint
		fetcher('/user/check-auth/')
			.then(() => setIsAuthenticated(true))
			.catch(() => setIsAuthenticated(false))
	}, [])

	const login = async (username: string, password: string) => {
		await fetcher('/user/token/', {
			method: 'POST',
			body: JSON.stringify({ username, password }),
		})
		setIsAuthenticated(true)
	}

	const logout = useCallback(() => {
		fetcher('/user/logout/', { method: 'POST' }).finally(() => {
			setIsAuthenticated(false)
			navigate("/login")
		})
	}, [navigate])

	const value = useMemo(() => ({
		isAuthenticated,
		login,
		logout,
		accessToken: null, // not needed now
	}), [isAuthenticated, logout])

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
	const context = useContext(AuthContext)
	if (!context) throw new Error("useAuth must be used within AuthProvider")
	return context
}

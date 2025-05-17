import { ModeToggle } from './mode-toggle'

export function AppFooter() {
    return (
        <footer className="flex flex-col items-center justify-between gap-4 min-h-[3rem] md:h-20 py-2 md:flex-row">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                © {new Date().getFullYear()} <span className="font-semibold">journalclub.in</span>. All rights reserved.
            </p>
            <div className="hidden md:block">
                <ModeToggle />
            </div>
        </footer>
    )
}

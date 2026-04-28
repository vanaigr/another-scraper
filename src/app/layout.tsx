import R from 'react'
import './global.css'

export default function({ children }: { children?: R.ReactNode }) {
    return <html>
        <head>
        </head>
        <body>
            {children}
        </body>
    </html>
}

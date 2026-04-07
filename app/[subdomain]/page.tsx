"use client"
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
const Page = () => {
    return (
        <div className="flex items-center justify-center w-screen h-screen">
            <Tldraw />
        </div>
    )
}

export default Page
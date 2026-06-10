"use client"

import { XIcon } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

const TourContext = React.createContext<{
    start: (tourId: string) => void
    close: () => void
} | null>(null)

function useTour() {
    const context = React.useContext(TourContext)
    if (!context) {
        throw new Error("useTour must be used within a TourProvider")
    }
    return context
}

interface Step {
    id: string
    title: React.ReactNode
    content: React.ReactNode
    nextRoute?: string
    previousRoute?: string
    nextLabel?: React.ReactNode
    previousLabel?: React.ReactNode
    side?: "left" | "right"
    className?: string
}

interface Tour {
    id: string
    steps: Step[]
}

function TourProvider({
    tours,
    children,
}: {
    tours: Tour[]
    children: React.ReactNode
}) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [activeTourId, setActiveTourId] = React.useState<string | null>(null)
    const [currentStepIndex, setCurrentStepIndex] = React.useState(0)

    const activeTour = tours.find((tour) => tour.id === activeTourId)
    const steps = activeTour?.steps || []

    function next() {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex((prev) => prev + 1)
        } else {
            setIsOpen(false)
            setCurrentStepIndex(0)
            setActiveTourId(null)
        }
    }

    function previous() {
        if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1)
        }
    }

    function close() {
        setIsOpen(false)
        setCurrentStepIndex(0)
        setActiveTourId(null)
    }

    function start(tourId: string) {
        const tour = tours.find((tour) => tour.id === tourId)
        if (tour) {
            if (tour.steps.length > 0) {
                setActiveTourId(tourId)
                setIsOpen(true)
                setCurrentStepIndex(0)
            } else {
                console.error(`Tour with id '${tourId}' has no steps.`)
            }
        } else {
            console.error(`Tour with id '${tourId}' not found.`)
        }
    }

    return (
        <TourContext.Provider
            value={{
                start,
                close,
            }}>
            {children}
            {isOpen && activeTour && steps.length > 0 && (
                <TourOverlay
                    step={steps[currentStepIndex]}
                    currentStepIndex={currentStepIndex}
                    totalSteps={steps.length}
                    onNext={next}
                    onPrevious={previous}
                    onClose={close}
                />
            )}
        </TourContext.Provider>
    )
}

function TourOverlay({
    step,
    currentStepIndex,
    totalSteps,
    onNext,
    onPrevious,
    onClose,
}: {
    step: Step
    currentStepIndex: number
    totalSteps: number
    onNext: () => void
    onPrevious: () => void
    onClose: () => void
}) {
    const [targets, setTargets] = React.useState<
        { rect: DOMRect; radius: number }[]
    >([])

    React.useEffect(() => {
        let needsScroll = true

        function updatePosition() {
            const elements = document.querySelectorAll(
                `[data-tour-step-id*='${step.id}']`
            )

            if (elements.length > 0) {
                const validElements: {
                    rect: {
                        width: number
                        height: number
                        x: number
                        y: number
                        left: number
                        top: number
                        right: number
                        bottom: number
                        toJSON: () => void
                    }
                    radius: number
                    element: Element
                }[] = []

                Array.from(elements).forEach((element) => {
                    const rect = element.getBoundingClientRect()
                    if (rect.width === 0 && rect.height === 0) return

                    const style = window.getComputedStyle(element)
                    const radius = Number(style.borderRadius) || 4

                    validElements.push({
                        rect: {
                            width: rect.width,
                            height: rect.height,
                            x: rect.left,
                            y: rect.top,
                            left: rect.left,
                            top: rect.top,
                            right: rect.right,
                            bottom: rect.bottom,
                            toJSON: () => {},
                        },
                        radius,
                        element,
                    })
                })

                setTargets(
                    validElements.map(({ rect, radius }) => ({ rect, radius }))
                )

                if (validElements.length > 0 && needsScroll) {
                    validElements[0].element.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    })
                    needsScroll = false
                }
            } else {
                setTargets([])
            }
        }

        updatePosition()
        const handleResizeOrScroll = () => updatePosition()

        window.addEventListener("resize", handleResizeOrScroll)
        window.addEventListener("scroll", handleResizeOrScroll, true)

        const observer = new MutationObserver(() => updatePosition())
        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
        })

        const resizeObserver = new ResizeObserver(() => updatePosition())
        resizeObserver.observe(document.body)

        return () => {
            window.removeEventListener("resize", handleResizeOrScroll)
            window.removeEventListener("scroll", handleResizeOrScroll, true)
            observer.disconnect()
            resizeObserver.disconnect()
        }
    }, [step])

    React.useEffect(() => {
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = ""
        }
    }, [])

    if (!document) return null
    if (targets.length === 0) return null

    return createPortal(
        <div className="fixed inset-0 z-50">
            <svg className="absolute inset-0 size-full">
                <defs>
                    <mask id="tour-mask">
                        <rect
                            x="0"
                            y="0"
                            width="100%"
                            height="100%"
                            fill="white"
                        />
                        {targets.map((target, i) => (
                            <rect
                                key={i}
                                x={target.rect.left}
                                y={target.rect.top}
                                width={target.rect.width}
                                height={target.rect.height}
                                rx={target.radius}
                                fill="black"
                            />
                        ))}
                    </mask>
                </defs>
                <rect
                    width="100%"
                    height="100%"
                    mask="url(#tour-mask)"
                    className="fill-black opacity-20"
                />
                {targets.map((target, i) => {
                    return (
                        <rect
                            key={i}
                            x={target.rect.left}
                            y={target.rect.top}
                            width={target.rect.width}
                            height={target.rect.height}
                            rx={target.radius}
                            className="stroke-primary fill-none stroke-2"
                        />
                    )
                })}
            </svg>
            {targets.length > 0 && (() => {
                const rect = targets[0].rect
                const gap = 12
                const cardW = 320
                const estH = 240
                const vw = typeof window !== "undefined" ? window.innerWidth : 1280
                const vh = typeof window !== "undefined" ? window.innerHeight : 800
                // Mặc định đặt card bên phải spotlight; hết chỗ thì lật sang trái.
                let left = step.side === "left" ? rect.left - cardW - gap : rect.right + gap
                if (left + cardW > vw - 8) left = rect.left - cardW - gap
                if (left < 8) left = Math.min(rect.right + gap, vw - cardW - 8)
                let top = rect.top + rect.height / 2 - estH / 2
                top = Math.max(8, Math.min(top, vh - estH - 8))
                return (
                    <div className="pointer-events-auto absolute w-80 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-200" style={{ left, top }}>
                        <Card className={cn("shadow-lg", step.className)}>
                            <CardHeader>
                                <CardTitle>{step.title}</CardTitle>
                                <CardDescription>
                                    Bước {currentStepIndex + 1} / {totalSteps}
                                </CardDescription>
                                <CardAction>
                                    <Button variant="ghost" size="icon" onClick={onClose} aria-label="Đóng hướng dẫn">
                                        <XIcon />
                                    </Button>
                                </CardAction>
                            </CardHeader>
                            <CardContent>{step.content}</CardContent>
                            <CardFooter className="justify-between">
                                {currentStepIndex > 0 &&
                                    (step.previousRoute ? (
                                        <Button variant="outline" onClick={onPrevious} render={<Link href={step.previousRoute} />} nativeButton={false}>
                                            {step.previousLabel ?? "Quay lại"}
                                        </Button>
                                    ) : (
                                        <Button variant="outline" onClick={onPrevious}>
                                            {step.previousLabel ?? "Quay lại"}
                                        </Button>
                                    ))}
                                {step.nextRoute ? (
                                    <Button className="ml-auto" onClick={onNext} render={<Link href={step.nextRoute} />} nativeButton={false}>
                                        {step.nextLabel ?? (currentStepIndex === totalSteps - 1 ? "Xong" : "Tiếp")}
                                    </Button>
                                ) : (
                                    <Button className="ml-auto" onClick={onNext}>
                                        {step.nextLabel ?? (currentStepIndex === totalSteps - 1 ? "Xong" : "Tiếp")}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    </div>
                )
            })()}
        </div>,
        document.body
    )
}

export { TourProvider, useTour, type Step, type Tour }

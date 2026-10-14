import { useState } from 'react'

export function Counter() {
	const [count, setCount] = useState(0)

	return (
		<button
			type="button"
			className="bg-primary text-primary-foreground mt-6 rounded-lg px-4 py-3"
			onClick={() => setCount((value) => value + 1)}
		>
			Count: {count}
		</button>
	)
}

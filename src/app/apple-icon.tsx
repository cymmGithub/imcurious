import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
	return new ImageResponse(
		<div
			style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: '#0a0a0a',
				borderRadius: 40,
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			{/* Grid lines */}
			<svg
				viewBox="0 0 180 180"
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
				}}
			>
				<line
					x1="45"
					y1="0"
					x2="45"
					y2="180"
					stroke="#1a1a1a"
					strokeWidth="1"
				/>
				<line
					x1="90"
					y1="0"
					x2="90"
					y2="180"
					stroke="#1a1a1a"
					strokeWidth="1"
				/>
				<line
					x1="135"
					y1="0"
					x2="135"
					y2="180"
					stroke="#1a1a1a"
					strokeWidth="1"
				/>
				<line
					x1="0"
					y1="45"
					x2="180"
					y2="45"
					stroke="#1a1a1a"
					strokeWidth="1"
				/>
				<line
					x1="0"
					y1="90"
					x2="180"
					y2="90"
					stroke="#1a1a1a"
					strokeWidth="1"
				/>
				<line
					x1="0"
					y1="135"
					x2="180"
					y2="135"
					stroke="#1a1a1a"
					strokeWidth="1"
				/>
			</svg>

			{/* Question mark */}
			<svg
				viewBox="0 0 64 64"
				style={{
					width: 120,
					height: 120,
				}}
			>
				<path
					d="M 22 20 C 22 11, 32 7, 38 10 C 44 13, 44 19, 38 24 C 35 26.5, 33 28, 33 33 L 33 38"
					fill="none"
					stroke="#e8e4dc"
					strokeWidth="4.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<circle cx="33" cy="49" r="4" fill="#dc2626" />
			</svg>
		</div>,
		{
			...size,
		},
	)
}

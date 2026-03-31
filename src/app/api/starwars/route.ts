const CHARACTERS = [
	{ name: 'Luke Skywalker', homeworld: 'Tatooine' },
	{ name: 'Darth Vader', homeworld: 'Tatooine' },
	{ name: 'Leia Organa', homeworld: 'Alderaan' },
	{ name: 'Han Solo', homeworld: 'Corellia' },
	{ name: 'Yoda', homeworld: 'Dagobah' },
	{ name: 'Obi-Wan Kenobi', homeworld: 'Stewjon' },
	{ name: 'Chewbacca', homeworld: 'Kashyyyk' },
	{ name: 'R2-D2', homeworld: 'Naboo' },
	{ name: 'C-3PO', homeworld: 'Tatooine' },
	{ name: 'Padmé Amidala', homeworld: 'Naboo' },
	{ name: 'Mace Windu', homeworld: 'Haruun Kal' },
	{ name: 'Boba Fett', homeworld: 'Kamino' },
	{ name: 'Lando Calrissian', homeworld: 'Socorro' },
	{ name: 'Ahsoka Tano', homeworld: 'Shili' },
	{ name: 'Din Djarin', homeworld: 'Aq Vetina' },
	{ name: 'Rey', homeworld: 'Jakku' },
	{ name: 'Kylo Ren', homeworld: 'Chandrila' },
	{ name: 'Grogu', homeworld: 'Unknown' },
	{ name: 'Palpatine', homeworld: 'Naboo' },
	{ name: 'Jabba the Hutt', homeworld: 'Nal Hutta' },
]

export async function GET() {
	const delay = 200 + Math.floor(Math.random() * 600)
	await new Promise((resolve) => setTimeout(resolve, delay))

	const character = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
	return Response.json(character)
}

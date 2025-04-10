# 🎨 Memo Game: Masters of Impressionism

A web-based **solo memory card game** built with **TypeScript** and **Becsy (Entity Component System)**. Flip cards to match pairs of world-renowned Impressionist and Post-Impressionist paintings!

## 🧠 About the Game

Test your memory and sharpen your focus with this elegant card-matching game featuring iconic artworks from the late 19th and early 20th centuries. Designed with simplicity and beauty in mind, this solo game invites you to enjoy both play and art.

## 🧰 Tech Stack

- **TypeScript** – for strong typing and modern JS development
- **Becsy** – a high-performance Entity Component System framework
- **WebGL** - rendering implementation
- **Vite** - fast dev & build processes
- **Vitest** - testing framework for unit tests

## 🖼️ Featured Artworks

The game includes 12 pairs (24 cards total), each featuring a painting by a celebrated Impressionist or Post-Impressionist master:

1. *At the Moulin Rouge - The Dance*, Henri de Toulouse-Lautrec, 1890
2. *The Ballet Class*, Edgar Degas, 1873
3. *Boulevard Montmartre, Spring*, Camille Pissarro, 1897
4. *Children Playing on the Beach*, Mary Cassatt, 1884
5. *Dance at Bougival*, Pierre-Auguste Renoir, 1883
6. *Le Déjeuner sur l'herbe*, Édouard Manet, 1863
7. *The Green Line*, Henri Matisse, 1905
8. *Impression, Sunrise*, Claude Monet, 1872
9. *Jeanne Samary in a Low-Necked Dress*, Pierre-Auguste Renoir, 1877
10. *Mont Sainte-Victoire*, Paul Cézanne, c. 1890s
11. *The Starry Night*, Vincent van Gogh, 1889
12. *A Sunday Afternoon on the Island of La Grande Jatte*, Georges Seurat, 1884

## 🎮 Gameplay

- All cards are laid out face down in a grid.
- Click to reveal two cards.
- If the paintings match, they stay revealed.
- If not, they flip back after a short delay.
- The game ends when all 12 pairs are matched.
- The app will track number of moves and completion time.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 16
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/memo-game-impressionist.git
cd memo-game-impressionist

# Install dependencies
npm install

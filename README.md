#  USA City Settlement Explorer

> An interactive, multidimensional data visualization dashboard helping users discover their ideal city to settle down in the United States.

##  Overview

This project proposes an interactive visualization dashboard designed to simplify complex socio-economic data. By addressing the challenge of visual information overload (managing ~2000 communities across 50 states), this tool makes data exploration simple, intuitive, and clear.

##  Key Features

I designed a dashboard structured around two highly interactive visualizations, completely synchronized in real-time:

*  Multivariate Scatterplot (Left): Equipped with a **2D Brush** selection tool. It allows users to fluidly filter clusters of cities based on specific criteria (e.g., Median Income vs. Violent Crime Rate) in a single gesture.
*  Zoomable Circle Packing (Right): Illustrates the geographical and administrative hierarchy (States ➔ Communities). It uses a sleek "Zoom" interaction to solve the 2000-node density problem, adhering strictly to the *"Overview first, zoom and filter, then details-on-demand"* mantra.
*  Real-Time Synchronization (Brushing & Linking): The two charts are synchronized via **Redux**. When cities are selected in the attribute space (Scatterplot), they instantly light up in their respective geographical space (Circle Packing).

##  Tech Stack

* React (Hooks: `useState`, `useRef`, `useEffect`)
* D3.js (v7) - Using the modern `.join()` General Update Pattern and D3-Hierarchy.
* Redux Toolkit - For seamless, cross-component state management.

## 📸 Screenshots


<img width="1913" height="943" alt="image" src="https://github.com/user-attachments/assets/5a4bbb76-21ee-4c91-94fb-796f66a3e040" />
Figure 1: Real-time synchronization between the 2D Brush and the Zoomable Circle Packing.

<img width="1918" height="942" alt="image" src="https://github.com/user-attachments/assets/e691c7da-67c8-486d-964b-586daa6265be" />

<img width="1917" height="946" alt="image" src="https://github.com/user-attachments/assets/ca9d981a-8cab-4468-b5cf-46b1232a87ad" />
Figure 2,3: Details on demand triggered by click and hover events inside a specific state.





# Same problem, solved with multi-source BFS (faster for big grids)
from collections import deque

R, C = map(int, input("Enter rows and columns: ").split())
print("Enter the crate:")
grid = [list(input().strip()) for _ in range(R)]

dist = [[-1] * C for _ in range(R)]
q = deque()
for r in range(R):
    for c in range(C):
        if grid[r][c] == 'R':
            dist[r][c] = 0          # every rotten fruit is a starting point
            q.append((r, c))

minutes = 0
while q:
    r, c = q.popleft()
    for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        nr, nc = r + dr, c + dc
        if 0 <= nr < R and 0 <= nc < C and grid[nr][nc] == 'F' and dist[nr][nc] == -1:
            dist[nr][nc] = dist[r][c] + 1
            minutes = max(minutes, dist[nr][nc])
            q.append((nr, nc))

print(f"Minutes: {minutes}")

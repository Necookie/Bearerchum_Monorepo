from collections import deque

R, C = map(int, input("Enter rows and columns: ").split())
print("Enter the map:")
grid = [input().strip() for _ in range(R)]

seen = [[False] * C for _ in range(R)]
islands = 0
for r in range(R):
    for c in range(C):
        if grid[r][c] == '#' and not seen[r][c]:
            islands += 1                      # new island found -> flood it
            seen[r][c] = True
            q = deque([(r, c)])
            while q:
                x, y = q.popleft()
                for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < R and 0 <= ny < C and grid[nx][ny] == '#' and not seen[nx][ny]:
                        seen[nx][ny] = True
                        q.append((nx, ny))

print(f"Islands: {islands}")

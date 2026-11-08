R, C = map(int, input("Enter rows and columns: ").split())
print("Enter the crate:")
grid = [list(input().strip()) for _ in range(R)]

minutes = 0
while True:
    to_rot = []                              # step 1: MARK, don't change yet
    for r in range(R):
        for c in range(C):
            if grid[r][c] == 'F':
                for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < R and 0 <= nc < C and grid[nr][nc] == 'R':
                        to_rot.append((r, c))
                        break
    if not to_rot:                           # step 2: nothing marked -> stop
        break
    for r, c in to_rot:                      # apply all changes at once
        grid[r][c] = 'R'
    minutes += 1

print(f"Minutes: {minutes}")

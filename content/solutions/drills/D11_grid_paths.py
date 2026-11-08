R, C = map(int, input("Enter rows and columns: ").split())
print("Enter the grid:")
g = [input().strip() for _ in range(R)]

# ways[i][j] = number of paths from (0,0) to (i,j) moving only right/down
ways = [[0] * C for _ in range(R)]
for i in range(R):
    for j in range(C):
        if g[i][j] == '#':
            ways[i][j] = 0                       # blocked cell
        elif i == 0 and j == 0:
            ways[i][j] = 1                       # start
        else:
            from_top = ways[i - 1][j] if i > 0 else 0
            from_left = ways[i][j - 1] if j > 0 else 0
            ways[i][j] = from_top + from_left

print(f"Paths: {ways[R - 1][C - 1]}")

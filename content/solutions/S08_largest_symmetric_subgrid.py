N = int(input("Enter size of matrix: "))
print("Enter matrix elements:")
A = [list(map(int, input().split())) for _ in range(N)]
REV = [row[::-1] for row in A]              # each row reversed (pre-computed once)

def symmetric(r, c, k):
    # cheap check first: the two opposite corners must match
    if A[r][c] != A[r + k - 1][c + k - 1]:
        return False
    # row i of the block must equal row (k-1-i) of the block, reversed
    for i in range(k // 2 + 1):
        top = A[r + i][c:c + k]
        bottom_rev = REV[r + k - 1 - i][N - c - k:N - c]
        if top != bottom_rev:
            return False
    return True

def solve():
    for k in range(N, 0, -1):               # try the BIGGEST size first
        for r in range(N - k + 1):
            for c in range(N - k + 1):
                if symmetric(r, c, k):
                    return k                # first hit = the answer
    return 1

print(f"Largest symmetric subgrid size: {solve()}")

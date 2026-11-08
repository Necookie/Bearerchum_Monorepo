N = int(input("Enter number of books: "))
days = list(map(int, input("Enter days kept: ").split()))

total = 0
for d in days:
    fine = max(0, d - 7) * 5      # 5 pesos per day beyond the 7th (never negative)
    fine = min(fine, 50)          # cap at 50 pesos per book
    total += fine

print(f"Total fine: {total}")

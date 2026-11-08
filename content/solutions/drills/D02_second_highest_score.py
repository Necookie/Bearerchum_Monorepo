N = int(input("Enter N: "))
scores = list(map(int, input("Enter scores: ").split()))

distinct = sorted(set(scores), reverse=True)   # remove duplicates, biggest first
if len(distinct) < 2:
    print("Second highest: None")
else:
    print(f"Second highest: {distinct[1]}")

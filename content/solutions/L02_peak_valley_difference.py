N = int(input("Enter array size: "))
arr = list(map(int, input("Enter array elements: ").split()))

peaks = valleys = 0
for i in range(1, N - 1):                 # skip first and last element
    if arr[i] > arr[i - 1] and arr[i] > arr[i + 1]:
        peaks += arr[i]
    elif arr[i] < arr[i - 1] and arr[i] < arr[i + 1]:
        valleys += arr[i]

print(f"Result: {peaks - valleys}")

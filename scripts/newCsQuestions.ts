import { Question } from "../src/types";

export const NEW_CS_QUESTIONS: Question[] = [
  {
    "id": "tcat-cs-91",
    "subject": "Computer Science",
    "topic": "Computer Fundamentals",
    "difficulty": "Easy",
    "q": "In the classic Von Neumann architecture, which bus is unidirectional under normal memory read operations?",
    "options": [
      "Data Bus",
      "Address Bus",
      "Control Bus",
      "System Clock Bus"
    ],
    "correct": 1,
    "explain": "The Address Bus is unidirectional; the CPU sends memory addresses out to system memory or I/O controllers to select specific storage locations."
  },
  {
    "id": "tcat-cs-92",
    "subject": "Computer Science",
    "topic": "Computer Fundamentals",
    "difficulty": "Easy",
    "q": "Which register holds the memory address of the next instruction waiting to be fetched and executed?",
    "options": [
      "Instruction Register (IR)",
      "Program Counter (PC)",
      "Memory Buffer Register (MBR)",
      "Accumulator (ACC)"
    ],
    "correct": 1,
    "explain": "The Program Counter (PC) automatically increments or branches to hold the address of the next sequential instruction."
  },
  {
    "id": "tcat-cs-93",
    "subject": "Computer Science",
    "topic": "Computer Fundamentals",
    "difficulty": "Easy",
    "q": "What is the primary role of the BIOS / UEFI firmware stored in non-volatile ROM/Flash during system boot?",
    "options": [
      "Compiling kernel source code into machine instructions",
      "Executing the Power-On Self-Test (POST) and bootstrapping the OS loader",
      "Managing virtual memory page swapping on the SSD",
      "Allocating dynamic heap memory to background daemon processes"
    ],
    "correct": 1,
    "explain": "The firmware runs the Power-On Self-Test (POST), initializes essential motherboard hardware, and transfers execution control to the OS bootloader."
  },
  {
    "id": "tcat-cs-94",
    "subject": "Computer Science",
    "topic": "Computer Fundamentals",
    "difficulty": "Easy",
    "q": "Which optical or solid-state storage technology stores binary bits using trapped electron charges in floating-gate or charge-trap flash cells rather than magnetic domains?",
    "options": [
      "Hard Disk Drive (HDD)",
      "Solid-State Drive (SSD)",
      "Magnetic Tape",
      "Floppy Disk"
    ],
    "correct": 1,
    "explain": "Solid-State Drives (SSDs) utilize NAND flash memory with floating-gate or charge-trap transistors to retain digital charges without moving parts."
  },
  {
    "id": "tcat-cs-95",
    "subject": "Computer Science",
    "topic": "Computer Fundamentals",
    "difficulty": "Hard",
    "q": "In a multi-level cache hierarchy, what is the typical relationship between L1, L2, and L3 caches in terms of access latency and storage capacity?",
    "options": [
      "L1 has the lowest latency and smallest capacity; L3 has the highest latency and largest capacity",
      "L1 has the largest capacity and lowest latency; L3 has the smallest capacity and highest latency",
      "L3 has the lowest latency and smallest capacity; L1 has the highest latency and largest capacity",
      "All cache levels share identical capacity and access latency"
    ],
    "correct": 0,
    "explain": "L1 cache sits directly inside processor core execution pipelines (fastest, smallest, ~32-64 KB), whereas L3 is shared across cores (larger, slower, ~8-64 MB)."
  },
  {
    "id": "tcat-cs-96",
    "subject": "Computer Science",
    "topic": "Computer Fundamentals",
    "difficulty": "Hard",
    "q": "How does Direct Memory Access (DMA) optimize system I/O performance during large file transfers between disk controllers and main RAM?",
    "options": [
      "It accelerates CPU arithmetic operations using vector registers",
      "It allows hardware devices to transfer data directly to/from RAM without CPU cycle intervention",
      "It replaces physical memory addresses with encrypted virtual page tables",
      "It compresses data packets before transmitting across the system bus"
    ],
    "correct": 1,
    "explain": "A DMA controller handles data transfers directly between I/O peripherals and RAM, freeing the CPU from executing per-byte load/store instructions."
  },
  {
    "id": "tcat-cs-97",
    "subject": "Computer Science",
    "topic": "Computer Fundamentals",
    "difficulty": "Medium",
    "q": "Under the IEEE 754 standard for single-precision 32-bit floating-point representation, what is the bit allocation for the Sign, Biased Exponent, and Mantissa (Fraction)?",
    "options": [
      "Sign: 1 bit, Exponent: 8 bits, Mantissa: 23 bits",
      "Sign: 1 bit, Exponent: 11 bits, Mantissa: 20 bits",
      "Sign: 2 bits, Exponent: 6 bits, Mantissa: 24 bits",
      "Sign: 1 bit, Exponent: 7 bits, Mantissa: 24 bits"
    ],
    "correct": 0,
    "explain": "IEEE 754 32-bit float uses 1 bit for sign, 8 bits for excess-127 exponent, and 23 bits for the normalized significand (mantissa)."
  },
  {
    "id": "tcat-cs-98",
    "subject": "Computer Science",
    "topic": "Computer Fundamentals",
    "difficulty": "Medium",
    "q": "Which pipeline hazard occurs when an instruction depends on the result of a previous instruction that has not yet completed its write-back phase?",
    "options": [
      "Structural hazard",
      "Data hazard (Read-After-Write)",
      "Control hazard (Branch penalty)",
      "Bus contention hazard"
    ],
    "correct": 1,
    "explain": "A Data hazard (RAW) occurs when instruction j tries to read a source register before prior instruction i has written its updated value."
  },
  {
    "id": "tcat-cs-99",
    "subject": "Computer Science",
    "topic": "Computer Fundamentals",
    "difficulty": "Medium",
    "q": "In virtual memory systems, what is the primary cause of \"thrashing\"?",
    "options": [
      "The CPU overheating due to excessive clock overclocking",
      "The operating system spending more time swapping pages between RAM and disk than executing user processes",
      "A software deadlock between two concurrent database transactions",
      "An unhandled division-by-zero hardware exception"
    ],
    "correct": 1,
    "explain": "Thrashing occurs when active working sets exceed physical RAM, causing constant page faults and continuous disk paging activity."
  },
  {
    "id": "tcat-cs-100",
    "subject": "Computer Science",
    "topic": "Computer Fundamentals",
    "difficulty": "Hard",
    "q": "In RAID storage configurations, which level provides block-level striping with distributed parity across all member disks without requiring a dedicated parity drive?",
    "options": [
      "RAID 0",
      "RAID 1",
      "RAID 4",
      "RAID 5"
    ],
    "correct": 3,
    "explain": "RAID 5 stripes both data and parity blocks across all drives (distributed parity), eliminating the write bottleneck of a dedicated parity disk (which characterizes RAID 4)."
  },
  {
    "id": "tcat-cs-101",
    "subject": "Computer Science",
    "topic": "Computer Fundamentals",
    "difficulty": "Hard",
    "q": "What is the function of the Translation Lookaside Buffer (TLB) in modern hardware memory management units (MMU)?",
    "options": [
      "To store dirty cache lines before writing back to main DRAM",
      "To cache recent virtual-to-physical page address translations, bypassing page table walks in RAM",
      "To execute arithmetic instructions directly inside the memory controller",
      "To verify the cryptographic digital signature of bootloader binaries"
    ],
    "correct": 1,
    "explain": "The TLB is an associative hardware cache that stores recent virtual-to-physical page mappings, avoiding the latency of multi-level page table lookups in RAM."
  },
  {
    "id": "tcat-cs-102",
    "subject": "Computer Science",
    "topic": "Computer Fundamentals",
    "difficulty": "Hard",
    "q": "Which interrupt type is non-maskable (NMI) and dispatched directly to the CPU to handle catastrophic hardware malfunctions such as parity errors or bus timeouts?",
    "options": [
      "Software interrupt generated by an `int 0x80` syscall instruction",
      "Hardware interrupt generated by a keyboard keystroke",
      "Non-Maskable Interrupt (NMI) line signaling critical memory or bus faults",
      "Timer interrupt generated by the 8254 Programmable Interval Timer"
    ],
    "correct": 2,
    "explain": "An NMI cannot be ignored or masked by the processor interrupt flag (IF) and is reserved for critical, unrecoverable hardware events."
  },
  {
    "id": "tcat-cs-103",
    "subject": "Computer Science",
    "topic": "Computer Fundamentals",
    "difficulty": "Hard",
    "q": "In modern superscalar processors, what is the primary benefit of Out-of-Order (OoO) execution and Register Renaming?",
    "options": [
      "Eliminating false data dependencies (Write-After-Read and Write-After-Write hazards)",
      "Doubling the physical size of the L1 data cache lines",
      "Guaranteeing deterministic execution time for real-time aerospace firmware",
      "Eliminating the need for a hardware floating-point unit"
    ],
    "correct": 0,
    "explain": "Register renaming maps architectural registers to a larger pool of physical registers, resolving WAR (anti-dependence) and WAW (output-dependence) hazards to allow instructions to execute out of order."
  },
  {
    "id": "tcat-cs-104",
    "subject": "Computer Science",
    "topic": "Programming Fundamentals",
    "difficulty": "Easy",
    "q": "In C/C++, what is the size (in bytes) of a `char` data type as mandated by the ANSI/ISO C standard?",
    "options": [
      "1 byte",
      "2 bytes",
      "4 bytes",
      "Implementation-dependent (8 to 32 bits)"
    ],
    "correct": 0,
    "explain": "By definition in the ISO C standard, `sizeof(char)` is always exactly 1 byte."
  },
  {
    "id": "tcat-cs-105",
    "subject": "Computer Science",
    "topic": "Programming Fundamentals",
    "difficulty": "Easy",
    "q": "What is the output of the following C expression: `15 % 4`?",
    "options": [
      "3.75",
      "3",
      "2",
      "0"
    ],
    "correct": 1,
    "explain": "The modulus operator `%` computes the integer remainder of division: 15 / 4 = 3 with remainder 3."
  },
  {
    "id": "tcat-cs-106",
    "subject": "Computer Science",
    "topic": "Programming Fundamentals",
    "difficulty": "Easy",
    "q": "In structured programming, which condition is mandatory to prevent a recursive function from executing infinitely until a stack overflow occurs?",
    "options": [
      "A global static counter variable",
      "A base case terminating condition",
      "An explicit heap memory allocation",
      "A goto jumping statement"
    ],
    "correct": 1,
    "explain": "Every valid recursive function must define a base case that returns without making further recursive calls."
  },
  {
    "id": "tcat-cs-107",
    "subject": "Computer Science",
    "topic": "Programming Fundamentals",
    "difficulty": "Easy",
    "q": "Which logical operator exhibits short-circuit evaluation such that the second operand is never evaluated if the first operand evaluates to `false`?",
    "options": [
      "Logical OR (`||`)",
      "Logical AND (`&&`)",
      "Bitwise AND (`&`)",
      "Bitwise XOR (`^`)"
    ],
    "correct": 1,
    "explain": "In C and C++, `&&` stops evaluation immediately if the left-hand operand is false, since false AND anything is guaranteed to be false."
  },
  {
    "id": "tcat-cs-108",
    "subject": "Computer Science",
    "topic": "Programming Fundamentals",
    "difficulty": "Easy",
    "q": "What does the `break` statement do when executed inside a nested `for` loop in C/C++?",
    "options": [
      "Terminates all outer loops immediately",
      "Terminates the innermost enclosing loop and resumes execution at the next outer statement",
      "Skips the current iteration and begins the next loop increment",
      "Halts the entire program execution"
    ],
    "correct": 1,
    "explain": "A `break` statement exits only the innermost loop or `switch` block in which it appears."
  },
  {
    "id": "tcat-cs-109",
    "subject": "Computer Science",
    "topic": "Programming Fundamentals",
    "difficulty": "Medium",
    "q": "What is the value of `x` after executing: `int a = 5; int x = ++a * 2;`?",
    "options": [
      "10",
      "12",
      "11",
      "14"
    ],
    "correct": 1,
    "explain": "The pre-increment `++a` increments `a` from 5 to 6 first; then 6 * 2 yields 12."
  },
  {
    "id": "tcat-cs-110",
    "subject": "Computer Science",
    "topic": "Programming Fundamentals",
    "difficulty": "Medium",
    "q": "What is the difference between `malloc()` and `calloc()` functions in standard C memory management?",
    "options": [
      "`malloc()` allocates stack memory, whereas `calloc()` allocates heap memory",
      "`malloc()` does not initialize memory (contents are indeterminate), while `calloc()` clears allocated memory to all-bits-zero",
      "`calloc()` cannot allocate memory for arrays",
      "`malloc()` requires the number of elements and element size separately, whereas `calloc()` accepts only total bytes"
    ],
    "correct": 1,
    "explain": "`malloc(bytes)` leaves allocated bytes uninitialized; `calloc(n, size)` zeroes out every byte of allocated storage."
  },
  {
    "id": "tcat-cs-111",
    "subject": "Computer Science",
    "topic": "Programming Fundamentals",
    "difficulty": "Medium",
    "q": "Given `int arr[] = {10, 20, 30, 40}; int *ptr = arr;`, what does `*(ptr + 2)` evaluate to?",
    "options": [
      "10",
      "20",
      "30",
      "40"
    ],
    "correct": 2,
    "explain": "`ptr` points to `arr[0]` (10). Pointer arithmetic `ptr + 2` offsets by 2 integer elements, pointing to `arr[2]`, which dereferences to 30."
  },
  {
    "id": "tcat-cs-112",
    "subject": "Computer Science",
    "topic": "Programming Fundamentals",
    "difficulty": "Medium",
    "q": "What is the purpose of header guards (`#ifndef HEADER_H ... #endif`) in C/C++ header files?",
    "options": [
      "To prevent the header file from being compiled by the C++ linker",
      "To prevent duplicate definitions and compilation errors resulting from multiple inclusion of the same header",
      "To encrypt proprietary source code against unauthorized viewing",
      "To force the preprocessor to load functions into dynamic shared libraries"
    ],
    "correct": 1,
    "explain": "Header guards ensure that the declarations in a header file are parsed only once per translation unit, preventing redefinition errors."
  },
  {
    "id": "tcat-cs-113",
    "subject": "Computer Science",
    "topic": "Programming Fundamentals",
    "difficulty": "Medium",
    "q": "In C++, what happens when a function declares a parameter as `const int &val`?",
    "options": [
      "A copy of the argument is made and its value cannot be modified",
      "The parameter is passed by reference, avoiding copy overhead, and the function cannot modify the caller's original variable",
      "The argument must be an integer pointer allocated on the heap",
      "The function returns a constant reference to a local variable"
    ],
    "correct": 1,
    "explain": "Passing by `const &` combines the efficiency of pass-by-reference (no object copying) with the safety of immutability."
  },
  {
    "id": "tcat-cs-114",
    "subject": "Computer Science",
    "topic": "Programming Fundamentals",
    "difficulty": "Hard",
    "q": "What does the `static` keyword indicate when applied to a global variable defined outside of any function in a C file?",
    "options": [
      "The variable is placed in read-only code memory and cannot be modified",
      "The variable has internal linkage and is visible only within that specific translation unit (`.c` file)",
      "The variable is re-allocated every time a function is invoked",
      "The variable can be accessed across multiple translation units via `extern` declarations"
    ],
    "correct": 1,
    "explain": "A file-scope `static` variable has internal linkage, restricting its visibility to that specific source file and preventing symbol collisions."
  },
  {
    "id": "tcat-cs-115",
    "subject": "Computer Science",
    "topic": "Programming Fundamentals",
    "difficulty": "Hard",
    "q": "Consider the declaration: `int (*fp)(char, float);`. What does `fp` represent?",
    "options": [
      "A function returning a pointer to an array of integers",
      "A pointer to a function that takes `(char, float)` arguments and returns an `int`",
      "A macro expanding to a cast expression between char and float",
      "An array of function pointers with integer indices"
    ],
    "correct": 1,
    "explain": "`(*fp)(char, float)` declares a function pointer `fp` whose target function accepts a `char` and a `float` and yields an `int`."
  },
  {
    "id": "tcat-cs-116",
    "subject": "Computer Science",
    "topic": "Programming Fundamentals",
    "difficulty": "Hard",
    "q": "Why does structure padding occur in C/C++ structs (e.g., `struct { char c; int x; };` having size 8 instead of 5 on 32/64-bit architectures)?",
    "options": [
      "To allow the compiler to store variable names inside the binary",
      "To align data members on natural word boundaries matching hardware bus memory alignment requirements",
      "To prevent stack buffer overflow attacks during function calls",
      "To satisfy ASCII character encoding standards"
    ],
    "correct": 1,
    "explain": "CPUs access multi-byte data most efficiently when aligned to addresses that are multiples of the data size; compilers insert padding bytes to satisfy alignment."
  },
  {
    "id": "tcat-cs-117",
    "subject": "Computer Science",
    "topic": "Programming Fundamentals",
    "difficulty": "Hard",
    "q": "What is the asymptotic time complexity of evaluating the n-th Fibonacci number using a naive recursive implementation `fib(n) = fib(n-1) + fib(n-2)` without memoization?",
    "options": [
      "O(n)",
      "O(n log n)",
      "O(2^n)",
      "O(1)"
    ],
    "correct": 2,
    "explain": "Naive recursive Fibonacci creates a binary tree of redundant subproblem calls, resulting in exponential time complexity O(2^n)."
  },
  {
    "id": "tcat-cs-118",
    "subject": "Computer Science",
    "topic": "Data Structures Basics",
    "difficulty": "Easy",
    "q": "Which data structure operates strictly on a Last-In, First-Out (LIFO) access discipline?",
    "options": [
      "Queue",
      "Stack",
      "Linked List",
      "Binary Search Tree"
    ],
    "correct": 1,
    "explain": "A Stack follows the LIFO principle: the element added most recently is the first to be removed."
  },
  {
    "id": "tcat-cs-119",
    "subject": "Computer Science",
    "topic": "Data Structures Basics",
    "difficulty": "Easy",
    "q": "What is the worst-case time complexity of accessing an arbitrary element by index in a contiguous array of size n?",
    "options": [
      "O(1)",
      "O(n)",
      "O(log n)",
      "O(n^2)"
    ],
    "correct": 0,
    "explain": "Array indexing uses direct address calculation `Base + (Index * ElementSize)`, executing in constant time O(1)."
  },
  {
    "id": "tcat-cs-120",
    "subject": "Computer Science",
    "topic": "Data Structures Basics",
    "difficulty": "Easy",
    "q": "In a singly linked list, what does the `next` pointer of the last (tail) node store to indicate the end of the list?",
    "options": [
      "The address of the head node",
      "A NULL pointer (or 0 / nullptr)",
      "A pointer to itself",
      "The total count of nodes"
    ],
    "correct": 1,
    "explain": "The terminal node in a standard linear linked list points to NULL (nullptr), signaling that no successor nodes exist."
  },
  {
    "id": "tcat-cs-121",
    "subject": "Computer Science",
    "topic": "Data Structures Basics",
    "difficulty": "Easy",
    "q": "Which linear data structure is standardly utilized for implementing Breadth-First Search (BFS) graph traversal?",
    "options": [
      "Stack",
      "Queue",
      "Binary Max-Heap",
      "Hash Set"
    ],
    "correct": 1,
    "explain": "BFS traverses graph vertices level by level, requiring a FIFO Queue to process vertices in the order they are discovered."
  },
  {
    "id": "tcat-cs-122",
    "subject": "Computer Science",
    "topic": "Data Structures Basics",
    "difficulty": "Medium",
    "q": "In a circular array queue of capacity N with index pointers `front` and `rear`, what is the formula to advance `rear` when enqueuing a new element?",
    "options": [
      "`rear = rear + 1`",
      "`rear = (rear + 1) % N`",
      "`rear = (rear - 1) % N`",
      "`rear = (front + rear) / 2`"
    ],
    "correct": 1,
    "explain": "Modulo arithmetic `(rear + 1) % N` wraps the pointer back to index 0 when the boundary of the allocated array is reached."
  },
  {
    "id": "tcat-cs-123",
    "subject": "Computer Science",
    "topic": "Data Structures Basics",
    "difficulty": "Medium",
    "q": "What is the in-order traversal of a Binary Search Tree (BST) guaranteed to produce?",
    "options": [
      "Nodes sorted in non-decreasing (ascending) order",
      "Nodes sorted in strictly descending order",
      "Nodes grouped strictly by their tree depth",
      "Leaves followed by internal parent nodes"
    ],
    "correct": 0,
    "explain": "In-order traversal visits `Left Subtree -> Root -> Right Subtree`. In a BST, this produces keys in sorted ascending order."
  },
  {
    "id": "tcat-cs-124",
    "subject": "Computer Science",
    "topic": "Data Structures Basics",
    "difficulty": "Medium",
    "q": "What is the worst-case search time complexity in an unbalanced Binary Search Tree containing n keys?",
    "options": [
      "O(log n)",
      "O(1)",
      "O(n)",
      "O(n log n)"
    ],
    "correct": 2,
    "explain": "When keys are inserted in sorted order, an unbalancing BST degenerates into a linear linked list with O(n) height and search time."
  },
  {
    "id": "tcat-cs-125",
    "subject": "Computer Science",
    "topic": "Data Structures Basics",
    "difficulty": "Medium",
    "q": "Which data structure can convert an infix arithmetic expression `(A + B) * C` into postfix notation `A B + C *`?",
    "options": [
      "Stack",
      "Double-ended Queue",
      "Min-Heap",
      "Adjacency Matrix"
    ],
    "correct": 0,
    "explain": "Dijkstra's Shunting-yard algorithm utilizes an operator Stack to manage operator precedence and parentheses when converting to postfix (RPN)."
  },
  {
    "id": "tcat-cs-126",
    "subject": "Computer Science",
    "topic": "Data Structures Basics",
    "difficulty": "Medium",
    "q": "In a complete binary max-heap stored in an array where the root is at index 0, what are the indices of the left child and right child of node `i`?",
    "options": [
      "Left: `2i + 1`, Right: `2i + 2`",
      "Left: `2i`, Right: `2i + 1`",
      "Left: `i / 2`, Right: `i / 2 + 1`",
      "Left: `i + 1`, Right: `i + 2`"
    ],
    "correct": 0,
    "explain": "For zero-based heap indexing, the left child of node `i` is at index `2i + 1` and the right child is at index `2i + 2`."
  },
  {
    "id": "tcat-cs-127",
    "subject": "Computer Science",
    "topic": "Data Structures Basics",
    "difficulty": "Hard",
    "q": "In an AVL tree, what is the permissible range for the balance factor (height of left subtree minus height of right subtree) of any node?",
    "options": [
      "0 only",
      "-1, 0, or +1",
      "-2, -1, 0, +1, or +2",
      "Any positive integer"
    ],
    "correct": 1,
    "explain": "By definition, an AVL tree requires every node to maintain a balance factor of -1, 0, or +1. If it reaches ±2, a rotation is triggered."
  },
  {
    "id": "tcat-cs-128",
    "subject": "Computer Science",
    "topic": "Data Structures Basics",
    "difficulty": "Hard",
    "q": "What is the amortized time complexity of inserting n elements into a dynamic array (vector) that doubles its capacity whenever it becomes full?",
    "options": [
      "O(1) per insertion",
      "O(log n) per insertion",
      "O(n) per insertion",
      "O(n^2) total"
    ],
    "correct": 0,
    "explain": "Although individual resizing operations require O(n) element copies, they occur infrequently; the aggregate cost divided over n insertions yields O(1) amortized time."
  },
  {
    "id": "tcat-cs-129",
    "subject": "Computer Science",
    "topic": "Data Structures Basics",
    "difficulty": "Hard",
    "q": "How does separate chaining resolve hash collisions in a hash table?",
    "options": [
      "By probing the next sequential slot in the array until an empty bucket is found",
      "By maintaining a linked list (or tree) of colliding key-value pairs at each bucket index",
      "By computing a second hash function `h2(key)` as an offset",
      "By doubling the hash table size on every collision"
    ],
    "correct": 1,
    "explain": "In separate chaining, each table bucket points to a linked list (or balanced tree) holding all records whose keys hashed to that identical index."
  },
  {
    "id": "tcat-cs-130",
    "subject": "Computer Science",
    "topic": "Data Structures Basics",
    "difficulty": "Hard",
    "q": "For a sparse graph with V vertices and E edges where E is much smaller than V^2, which representation is more space-efficient?",
    "options": [
      "Adjacency Matrix (space complexity O(V^2))",
      "Adjacency List (space complexity O(V + E))",
      "Edge Weight Truth Table (space complexity O(2^V))",
      "Both require identical memory space"
    ],
    "correct": 1,
    "explain": "An adjacency list allocates storage only for vertices and existing edges O(V + E), saving significant space over an O(V^2) matrix when E << V^2."
  },
  {
    "id": "tcat-cs-131",
    "subject": "Computer Science",
    "topic": "Boolean Algebra & Logic Gates",
    "difficulty": "Easy",
    "q": "According to De Morgan's First Law, what is the equivalent of `(A · B)'` (the complement of A AND B)?",
    "options": [
      "A' · B'",
      "A' + B'",
      "A + B",
      "(A + B)'"
    ],
    "correct": 1,
    "explain": "De Morgan's law states: `(A · B)' = A' + B'` (the complement of a product is the sum of complements)."
  },
  {
    "id": "tcat-cs-132",
    "subject": "Computer Science",
    "topic": "Boolean Algebra & Logic Gates",
    "difficulty": "Easy",
    "q": "Which pair of logic gates are known as \"universal gates\" because any combinational logic circuit can be constructed using only that gate type?",
    "options": [
      "AND and OR",
      "NAND and NOR",
      "XOR and XNOR",
      "NOT and AND"
    ],
    "correct": 1,
    "explain": "NAND and NOR gates are universal gates; complete sets of NOT, AND, and OR functions can be synthesized using either gate alone."
  },
  {
    "id": "tcat-cs-133",
    "subject": "Computer Science",
    "topic": "Boolean Algebra & Logic Gates",
    "difficulty": "Easy",
    "q": "What is the output of a two-input XOR gate when both inputs are binary 1?",
    "options": [
      "1",
      "0",
      "High Impedance (Z)",
      "Undefined"
    ],
    "correct": 1,
    "explain": "An XOR gate outputs 1 if and only if the inputs differ. When both inputs are 1, the output is 0."
  },
  {
    "id": "tcat-cs-134",
    "subject": "Computer Science",
    "topic": "Boolean Algebra & Logic Gates",
    "difficulty": "Easy",
    "q": "In Boolean algebra, what is the simplified value of `A + A' · B`?",
    "options": [
      "A",
      "B",
      "A + B",
      "A · B"
    ],
    "correct": 2,
    "explain": "By distributive law: `A + A'B = (A + A')(A + B) = (1)(A + B) = A + B`."
  },
  {
    "id": "tcat-cs-135",
    "subject": "Computer Science",
    "topic": "Boolean Algebra & Logic Gates",
    "difficulty": "Medium",
    "q": "What are the Boolean expressions for the Sum (S) and Carry (C) outputs of a Half Adder with inputs A and B?",
    "options": [
      "S = A ⊕ B, C = A · B",
      "S = A · B, C = A + B",
      "S = A + B, C = A ⊕ B",
      "S = (A · B)', C = A ⊕ B"
    ],
    "correct": 0,
    "explain": "A half adder computes `Sum = A ⊕ B` and `Carry = A · B`."
  },
  {
    "id": "tcat-cs-136",
    "subject": "Computer Science",
    "topic": "Boolean Algebra & Logic Gates",
    "difficulty": "Medium",
    "q": "How many select input lines are required for an 8-to-1 multiplexer (MUX)?",
    "options": [
      "2",
      "3",
      "4",
      "8"
    ],
    "correct": 1,
    "explain": "An 8-to-1 MUX selects 1 of 2^n inputs using n select lines. Since 2^3 = 8, exactly 3 select lines are required."
  },
  {
    "id": "tcat-cs-137",
    "subject": "Computer Science",
    "topic": "Boolean Algebra & Logic Gates",
    "difficulty": "Medium",
    "q": "What is the binary Gray code equivalent of the binary number `1010`?",
    "options": [
      "1111",
      "1100",
      "1110",
      "1001"
    ],
    "correct": 0,
    "explain": "Binary to Gray code: MSB remains 1. Next bit: 1 ⊕ 0 = 1. Next: 0 ⊕ 1 = 1. Next: 1 ⊕ 0 = 1. The result is 1111."
  },
  {
    "id": "tcat-cs-138",
    "subject": "Computer Science",
    "topic": "Boolean Algebra & Logic Gates",
    "difficulty": "Medium",
    "q": "In Karnaugh mapping (K-map), why are adjacent cells ordered using Gray code sequence (00, 01, 11, 10)?",
    "options": [
      "To maximize the visual symmetry of minterm groupings",
      "To ensure that adjacent cells differ by exactly one binary variable (single bit change)",
      "To simplify arithmetic addition in the accumulator",
      "To prevent race conditions on printed circuit traces"
    ],
    "correct": 1,
    "explain": "Gray code ordering ensures that moving between any two adjacent horizontal or vertical cells changes only one variable state, enabling algebraic simplification."
  },
  {
    "id": "tcat-cs-139",
    "subject": "Computer Science",
    "topic": "Boolean Algebra & Logic Gates",
    "difficulty": "Medium",
    "q": "What is the function of a 3-to-8 line decoder with active-low outputs when the input code is binary `011`?",
    "options": [
      "Output line 3 is set to LOW (0), while all other output lines remain HIGH (1)",
      "Output line 3 is set to HIGH (1), while all other output lines remain LOW (0)",
      "All 8 output lines are asserted to LOW simultaneously",
      "Lines 0, 1, and 1 are inverted"
    ],
    "correct": 0,
    "explain": "Binary 011 represents decimal 3. In an active-low decoder, only the selected line (line 3) goes LOW (0), with all unselected lines staying HIGH (1)."
  },
  {
    "id": "tcat-cs-140",
    "subject": "Computer Science",
    "topic": "Boolean Algebra & Logic Gates",
    "difficulty": "Hard",
    "q": "In an SR latch constructed using two cross-coupled NOR gates, which input combination is considered invalid/forbidden because it produces an unstable race condition?",
    "options": [
      "S = 0, R = 0",
      "S = 0, R = 1",
      "S = 1, R = 0",
      "S = 1, R = 1"
    ],
    "correct": 3,
    "explain": "For a NOR-based SR latch, setting S = 1 and R = 1 forces both Q and Q' outputs to 0 simultaneously, violating the complement rule and creating an unpredictable race condition upon return to 0,0."
  },
  {
    "id": "tcat-cs-141",
    "subject": "Computer Science",
    "topic": "Boolean Algebra & Logic Gates",
    "difficulty": "Hard",
    "q": "What problem occurs in a basic level-triggered JK flip-flop when both J = 1, K = 1, and the clock pulse duration is longer than the propagation delay of the gates?",
    "options": [
      "The flip-flop permanently latches into high impedance",
      "Race-around condition (continuous toggling during the clock pulse)",
      "The clock signal gets short-circuited to ground",
      "The output becomes locked to the J input voltage"
    ],
    "correct": 1,
    "explain": "The race-around condition occurs when J=1, K=1 and clock pulse width tp > gate delay Δt, causing the output to toggle repeatedly while the clock is high."
  },
  {
    "id": "tcat-cs-142",
    "subject": "Computer Science",
    "topic": "Boolean Algebra & Logic Gates",
    "difficulty": "Hard",
    "q": "How does a Master-Slave JK flip-flop eliminate the race-around condition?",
    "options": [
      "By using CMOS field-effect transistors instead of TTL bipolars",
      "By isolating the master stage (active on clock HIGH) and slave stage (active on clock LOW), preventing continuous feedback within a single cycle",
      "By setting both inputs J and K to zero during clock transitions",
      "By replacing the clock signal with a DC bias"
    ],
    "correct": 1,
    "explain": "The Master-Slave structure clocks the master on the leading edge and the slave on the trailing edge (via an inverter), breaking the direct feedback loop."
  },
  {
    "id": "tcat-cs-143",
    "subject": "Computer Science",
    "topic": "Boolean Algebra & Logic Gates",
    "difficulty": "Hard",
    "q": "A T (Toggle) flip-flop with input T = 1 is connected to a 100 MHz clock signal. What is the frequency of the output signal Q?",
    "options": [
      "100 MHz",
      "50 MHz",
      "200 MHz",
      "25 MHz"
    ],
    "correct": 1,
    "explain": "A T flip-flop with T=1 changes state on every active clock edge, requiring two clock pulses to complete one full output cycle; thus it acts as a frequency divider by 2 (100 MHz / 2 = 50 MHz)."
  },
  {
    "id": "tcat-cs-144",
    "subject": "Computer Science",
    "topic": "Computer Networks & Internet",
    "difficulty": "Easy",
    "q": "In the ISO-OSI reference model, which layer is responsible for end-to-end process-to-process communication, port addressing, and reliable data delivery?",
    "options": [
      "Network Layer",
      "Transport Layer",
      "Data Link Layer",
      "Session Layer"
    ],
    "correct": 1,
    "explain": "The Transport Layer (Layer 4) handles end-to-end communication, port addressing (e.g., TCP/UDP ports), flow control, and error recovery."
  },
  {
    "id": "tcat-cs-145",
    "subject": "Computer Science",
    "topic": "Computer Networks & Internet",
    "difficulty": "Easy",
    "q": "What is the standard size of a physical MAC (Media Access Control) address in Ethernet networking?",
    "options": [
      "32 bits (4 bytes)",
      "48 bits (6 bytes)",
      "64 bits (8 bytes)",
      "128 bits (16 bytes)"
    ],
    "correct": 1,
    "explain": "An Ethernet MAC address is 48 bits (6 bytes) long, commonly written in hexadecimal notation (e.g., 00:1A:2B:3C:4D:5E)."
  },
  {
    "id": "tcat-cs-146",
    "subject": "Computer Science",
    "topic": "Computer Networks & Internet",
    "difficulty": "Easy",
    "q": "Which standard Internet protocol maps a known IP address to a physical MAC address on a local area network?",
    "options": [
      "ARP (Address Resolution Protocol)",
      "DHCP (Dynamic Host Configuration Protocol)",
      "DNS (Domain Name System)",
      "ICMP (Internet Control Message Protocol)"
    ],
    "correct": 0,
    "explain": "ARP broadcasts on the local subnet to resolve an IP address to the target device's physical MAC address."
  },
  {
    "id": "tcat-cs-147",
    "subject": "Computer Science",
    "topic": "Computer Networks & Internet",
    "difficulty": "Easy",
    "q": "What protocol operates at port 53 by default to translate human-readable domain names (like www.google.com) into numerical IP addresses?",
    "options": [
      "HTTP",
      "FTP",
      "DNS",
      "SMTP"
    ],
    "correct": 2,
    "explain": "DNS (Domain Name System) translates alphanumeric domain names into IP addresses, communicating primarily via UDP port 53."
  },
  {
    "id": "tcat-cs-148",
    "subject": "Computer Science",
    "topic": "Computer Networks & Internet",
    "difficulty": "Easy",
    "q": "Which network topology connects every computer to a central hub, switch, or router via individual dedicated cables?",
    "options": [
      "Bus Topology",
      "Ring Topology",
      "Star Topology",
      "Mesh Topology"
    ],
    "correct": 2,
    "explain": "In a Star topology, all terminal nodes radiate from a central networking device (switch or hub)."
  },
  {
    "id": "tcat-cs-149",
    "subject": "Computer Science",
    "topic": "Computer Networks & Internet",
    "difficulty": "Medium",
    "q": "How many usable host IP addresses are available in an IPv4 subnet with CIDR prefix `/27`?",
    "options": [
      "32",
      "30",
      "62",
      "28"
    ],
    "correct": 1,
    "explain": "A `/27` subnet leaves 32 - 27 = 5 host bits. Total addresses = 2^5 = 32. Subtracting the network address and broadcast address yields 32 - 2 = 30 usable host addresses."
  },
  {
    "id": "tcat-cs-150",
    "subject": "Computer Science",
    "topic": "Computer Networks & Internet",
    "difficulty": "Medium",
    "q": "What is the correct three-step sequence of control packets exchanged during a TCP connection handshake?",
    "options": [
      "ACK -> SYN -> SYN-ACK",
      "SYN -> SYN-ACK -> ACK",
      "FIN -> ACK -> FIN-ACK",
      "SYN -> ACK -> DATA"
    ],
    "correct": 1,
    "explain": "TCP initiates connection through a three-way handshake: Client sends SYN, Server responds with SYN-ACK, and Client completes with ACK."
  },
  {
    "id": "tcat-cs-151",
    "subject": "Computer Science",
    "topic": "Computer Networks & Internet",
    "difficulty": "Medium",
    "q": "Which RFC 1918 private IPv4 address range is designated for Class C private local area networks?",
    "options": [
      "10.0.0.0 to 10.255.255.255",
      "172.16.0.0 to 172.31.255.255",
      "192.168.0.0 to 192.168.255.255",
      "169.254.0.0 to 169.254.255.255"
    ],
    "correct": 2,
    "explain": "`192.168.0.0/16` is the RFC 1918 designated Class C private address space."
  },
  {
    "id": "tcat-cs-152",
    "subject": "Computer Science",
    "topic": "Computer Networks & Internet",
    "difficulty": "Medium",
    "q": "How does UDP differ fundamentally from TCP in terms of delivery guarantees and overhead?",
    "options": [
      "UDP is connection-oriented and provides packet retransmission, whereas TCP is connectionless",
      "UDP is connectionless and provides low-overhead, best-effort delivery without packet reordering or retransmissions",
      "UDP encrypts all payloads using RSA by default",
      "UDP operates exclusively over fiber-optic physical media"
    ],
    "correct": 1,
    "explain": "UDP eliminates connection handshake, sequencing, and acknowledgement overhead, providing fast, best-effort transport ideal for real-time video/gaming."
  },
  {
    "id": "tcat-cs-153",
    "subject": "Computer Science",
    "topic": "Computer Networks & Internet",
    "difficulty": "Hard",
    "q": "In the CSMA/CD access control protocol used in legacy half-duplex Ethernet, how do stations handle a transmission collision?",
    "options": [
      "Both stations continue sending frames at higher transmission power",
      "Both stations immediately abort transmission, emit a jam signal, and execute binary exponential backoff before retransmitting",
      "The central hub discards the packet and terminates the offending node's connection",
      "The receiving station requests an immediate retransmission via ICMP"
    ],
    "correct": 1,
    "explain": "Upon detecting a collision, stations send a 32-bit jam signal, abort transmission, and wait a random backoff duration calculated using binary exponential backoff."
  },
  {
    "id": "tcat-cs-154",
    "subject": "Computer Science",
    "topic": "Computer Networks & Internet",
    "difficulty": "Hard",
    "q": "Which routing algorithm does Open Shortest Path First (OSPF) implement to calculate shortest path trees to all destinations?",
    "options": [
      "Bellman-Ford distance-vector algorithm",
      "Dijkstra's link-state algorithm",
      "Floyd-Warshall all-pairs algorithm",
      "Ford-Fulkerson maximum flow algorithm"
    ],
    "correct": 1,
    "explain": "OSPF is an interior gateway link-state protocol that runs Dijkstra's shortest-path algorithm over its synchronized topological link-state database."
  },
  {
    "id": "tcat-cs-155",
    "subject": "Computer Science",
    "topic": "Computer Networks & Internet",
    "difficulty": "Hard",
    "q": "How does asymmetric (public-key) cryptography establish secure symmetric session keys during a TLS / HTTPS handshake?",
    "options": [
      "The client encrypts a randomly generated symmetric pre-master secret using the server's certified public key",
      "The server publishes its private key to all clients over an unencrypted UDP broadcast",
      "Both parties compute identical keys using plain MD5 checksum hashing",
      "The ISP router injects a hardcoded hardware key into the TCP header"
    ],
    "correct": 0,
    "explain": "The client verifies the server's public key certificate and uses it (or Diffie-Hellman ephemeral exchange) to securely agree on a symmetric session key for bulk data encryption."
  },
  {
    "id": "tcat-cs-156",
    "subject": "Computer Science",
    "topic": "Computer Networks & Internet",
    "difficulty": "Hard",
    "q": "What is the function of the \"Time to Live\" (TTL) field in the IPv4 packet header?",
    "options": [
      "To record the total round-trip latency in milliseconds",
      "To prevent packets from circulating indefinitely in routing loops by decrementing at each router hop until discarded at 0",
      "To schedule the exact time of day when the packet should be delivered to the socket",
      "To count the number of data retransmissions attempted by TCP"
    ],
    "correct": 1,
    "explain": "Each router decrements the TTL field by at least 1. If TTL reaches zero, the router discards the packet and sends an ICMP \"Time Exceeded\" message back to the source."
  },
  {
    "id": "tcat-cs-157",
    "subject": "Computer Science",
    "topic": "Database Basics",
    "difficulty": "Easy",
    "q": "In the relational database model, what is a \"tuple\" equivalent to?",
    "options": [
      "A database table (relation)",
      "A single record (row)",
      "An attribute column",
      "A primary key constraint"
    ],
    "correct": 1,
    "explain": "In relational database formal terminology, a tuple corresponds to a single row or record in a relation (table)."
  },
  {
    "id": "tcat-cs-158",
    "subject": "Computer Science",
    "topic": "Database Basics",
    "difficulty": "Easy",
    "q": "Which relational database key uniquely identifies each record in a table and cannot contain NULL values?",
    "options": [
      "Foreign Key",
      "Primary Key",
      "Secondary Index Key",
      "Composite Foreign Key"
    ],
    "correct": 1,
    "explain": "A Primary Key enforces entity integrity: every table row must have a unique, non-null value for this key."
  },
  {
    "id": "tcat-cs-159",
    "subject": "Computer Science",
    "topic": "Database Basics",
    "difficulty": "Easy",
    "q": "Which SQL command is used to retrieve specific columns of data matching criteria from a database table?",
    "options": [
      "INSERT",
      "SELECT",
      "UPDATE",
      "DELETE"
    ],
    "correct": 1,
    "explain": "`SELECT` is the Data Query Language (DQL) command used to query and fetch records from tables."
  },
  {
    "id": "tcat-cs-160",
    "subject": "Computer Science",
    "topic": "Database Basics",
    "difficulty": "Easy",
    "q": "What type of entity relationship exists between Students and Courses in a university where a student enrolls in multiple courses and each course contains multiple students?",
    "options": [
      "One-to-One (1:1)",
      "One-to-Many (1:N)",
      "Many-to-Many (M:N)",
      "Unary Recursive"
    ],
    "correct": 2,
    "explain": "Students and Courses form a Many-to-Many (M:N) relationship, implemented via a junction (associative) table containing foreign keys to both."
  },
  {
    "id": "tcat-cs-161",
    "subject": "Computer Science",
    "topic": "Database Basics",
    "difficulty": "Easy",
    "q": "Which SQL clause is used to filter individual rows before any grouping or aggregation takes place?",
    "options": [
      "HAVING",
      "WHERE",
      "ORDER BY",
      "GROUP BY"
    ],
    "correct": 1,
    "explain": "`WHERE` filters individual records before grouping; `HAVING` filters grouped summary records after aggregation."
  },
  {
    "id": "tcat-cs-162",
    "subject": "Computer Science",
    "topic": "Database Basics",
    "difficulty": "Medium",
    "q": "What is the requirement for a database relation to satisfy First Normal Form (1NF)?",
    "options": [
      "It must contain no partial functional dependencies on a composite primary key",
      "All column attributes must contain only atomic (indivisible) values, with no repeating groups",
      "It must eliminate all transitive dependencies on non-key attributes",
      "Every determinant must be a candidate key"
    ],
    "correct": 1,
    "explain": "1NF requires all attributes to hold atomic values (single values, no arrays or comma-separated lists) and unique column names."
  },
  {
    "id": "tcat-cs-163",
    "subject": "Computer Science",
    "topic": "Database Basics",
    "difficulty": "Medium",
    "q": "A relation is in 1NF. What additional condition must it satisfy to be in Second Normal Form (2NF)?",
    "options": [
      "It must have no multi-valued dependencies",
      "It must have no partial functional dependency; all non-prime attributes must be fully functionally dependent on the entire primary key",
      "It must contain zero NULL values across all columns",
      "It must be stored on distributed database partitions"
    ],
    "correct": 1,
    "explain": "2NF requires 1NF plus the absence of partial dependencies (no non-key attribute can depend on only part of a composite primary key)."
  },
  {
    "id": "tcat-cs-164",
    "subject": "Computer Science",
    "topic": "Database Basics",
    "difficulty": "Medium",
    "q": "What condition constitutes a violation of Third Normal Form (3NF)?",
    "options": [
      "A primary key consisting of more than one column",
      "A transitive functional dependency where a non-prime attribute depends on another non-prime attribute (`X -> Y -> Z`)",
      "Having an auto-incrementing integer identifier",
      "A foreign key referencing a table in the same database schema"
    ],
    "correct": 1,
    "explain": "3NF requires 2NF plus the removal of transitive dependencies, meaning non-key attributes must depend solely on candidate keys."
  },
  {
    "id": "tcat-cs-165",
    "subject": "Computer Science",
    "topic": "Database Basics",
    "difficulty": "Medium",
    "q": "What is the effect of an `INNER JOIN` between Table A and Table B on a specified join key?",
    "options": [
      "It returns all rows from Table A, matching or non-matching",
      "It returns only the rows where there is an exact match on the join predicate in both tables",
      "It returns all rows from both tables, filling missing fields with NULL",
      "It deletes duplicate records from both tables"
    ],
    "correct": 1,
    "explain": "An `INNER JOIN` selects only records that have matching values in both tables based on the join condition."
  },
  {
    "id": "tcat-cs-166",
    "subject": "Computer Science",
    "topic": "Database Basics",
    "difficulty": "Medium",
    "q": "In the relational database ACID properties, what does the \"A\" (Atomicity) guarantee?",
    "options": [
      "Data is encrypted at the atomic particle level",
      "All operations within a transaction succeed completely, or the entire transaction is rolled back with no partial effects",
      "Transactions execute concurrently without any shared locks",
      "Committed data persists permanently even through system power failure"
    ],
    "correct": 1,
    "explain": "Atomicity ensures \"all or nothing\" execution: if any part of a database transaction fails, all changes are aborted and rolled back."
  },
  {
    "id": "tcat-cs-167",
    "subject": "Computer Science",
    "topic": "Database Basics",
    "difficulty": "Hard",
    "q": "In Boyce-Codd Normal Form (BCNF), what rule must hold for every non-trivial functional dependency `X -> Y`?",
    "options": [
      "`X` must be a superkey",
      "`Y` must be a prime attribute",
      "`X` and `Y` must belong to the same composite key",
      "`X` must contain fewer attributes than `Y`"
    ],
    "correct": 0,
    "explain": "BCNF is a stricter version of 3NF: for every non-trivial functional dependency X -> Y, the determinant X must be a superkey."
  },
  {
    "id": "tcat-cs-168",
    "subject": "Computer Science",
    "topic": "Database Basics",
    "difficulty": "Hard",
    "q": "Which database indexing data structure is standardly used for disk-based relational storage engines because of its high fan-out, shallow tree depth, and sequential leaf node linking?",
    "options": [
      "Binary Search Tree",
      "B+ Tree",
      "Skip List",
      "Red-Black Tree"
    ],
    "correct": 1,
    "explain": "B+ Trees store all actual data pointers in leaf nodes linked as a contiguous doubly linked list, with internal nodes storing only keys for navigation, minimizing disk I/O."
  },
  {
    "id": "tcat-cs-169",
    "subject": "Computer Science",
    "topic": "Database Basics",
    "difficulty": "Hard",
    "q": "In database transaction management, what concurrency anomaly is characterized as a \"Dirty Read\"?",
    "options": [
      "A transaction reads data that has been modified by another concurrent uncommitted transaction that later rolls back",
      "A transaction rereads a row and discovers data values have been modified by a committed transaction",
      "A transaction re-executes a range query and discovers new rows inserted by another committed transaction",
      "Two transactions execute simultaneous writes resulting in deadlocks"
    ],
    "correct": 0,
    "explain": "A Dirty Read (Read Uncommitted anomaly) occurs when Transaction A reads modifications made by Transaction B before B commits; if B rolls back, A holds phantom, invalid data."
  },
  {
    "id": "tcat-cs-170",
    "subject": "Computer Science",
    "topic": "Database Basics",
    "difficulty": "Hard",
    "q": "What is the role of a Two-Phase Commit (2PC) protocol in distributed database architectures?",
    "options": [
      "To guarantee serializability by acquiring locks in a growing phase and releasing them in a shrinking phase",
      "To coordinate all distributed node participants across a network to ensure atomic commit or rollback of a distributed transaction",
      "To compress write-ahead transaction logs across two replication nodes",
      "To partition database tables into horizontal shards"
    ],
    "correct": 1,
    "explain": "Two-Phase Commit (Prepare phase followed by Commit/Abort phase) ensures all distributed participant nodes reach a unanimous agreement to commit or abort a transaction atomically."
  }
];

import { Question } from '../types';

/**
 * TCAT Computer Science Question Bank (90 MCQs)
 * Covers all 6 official UET Taxila TCAT Computer Science syllabus chapters:
 * 1. Computer Fundamentals (15 MCQs: 5 Easy, 5 Medium, 5 Hard)
 * 2. Programming Fundamentals (15 MCQs: 5 Easy, 5 Medium, 5 Hard)
 * 3. Data Structures Basics (15 MCQs: 5 Easy, 5 Medium, 5 Hard)
 * 4. Boolean Algebra & Logic Gates (15 MCQs: 5 Easy, 5 Medium, 5 Hard)
 * 5. Computer Networks & Internet (15 MCQs: 5 Easy, 5 Medium, 5 Hard)
 * 6. Database Basics (15 MCQs: 5 Easy, 5 Medium, 5 Hard)
 * Total: exactly 90 MCQs (30 Easy, 30 Medium, 30 Hard).
 * Every item has correct: 0 (shuffled at runtime), 4 distinct options, detailed factual explanation.
 */
export const TCAT_CS_QUESTIONS: Question[] = [
  // ==========================================
  // CHAPTER 1: Computer Fundamentals (15 MCQs)
  // ==========================================
  {
    id: 'tcat-cs-1',
    subject: 'Computer Science',
    topic: 'Computer Fundamentals',
    difficulty: 'Easy',
    q: 'Which component of the Central Processing Unit (CPU) is directly responsible for coordinating all operations and directing data flow between system components?',
    options: [
      'Control Unit (CU)',
      'Arithmetic Logic Unit (ALU)',
      'Program Counter (PC)',
      'Memory Data Register (MDR)'
    ],
    correct: 0,
    explain: 'The Control Unit (CU) fetches, decodes, and manages the execution of instructions, generating control signals for the ALU, memory, and I/O devices.'
  },
  {
    id: 'tcat-cs-2',
    subject: 'Computer Science',
    topic: 'Computer Fundamentals',
    difficulty: 'Easy',
    q: 'What is the binary representation of the decimal integer 25?',
    options: [
      '11001',
      '11010',
      '10101',
      '11100'
    ],
    correct: 0,
    explain: '25 in binary is 16 + 8 + 1 = 2^4 + 2^3 + 2^0 = 11001_2.'
  },
  {
    id: 'tcat-cs-3',
    subject: 'Computer Science',
    topic: 'Computer Fundamentals',
    difficulty: 'Easy',
    q: 'Which type of computer memory is non-volatile and permanently stores the initial firmware instructions (bootstrap loader)?',
    options: [
      'ROM (Read-Only Memory)',
      'SRAM (Static RAM)',
      'DRAM (Dynamic RAM)',
      'Cache Memory'
    ],
    correct: 0,
    explain: 'ROM retains its contents without power and stores the BIOS/UEFI firmware and initial bootstrap loader routines.'
  },
  {
    id: 'tcat-cs-4',
    subject: 'Computer Science',
    topic: 'Computer Fundamentals',
    difficulty: 'Easy',
    q: 'How many bits are used in standard ASCII encoding to represent a single character?',
    options: [
      '7 bits',
      '8 bits',
      '16 bits',
      '32 bits'
    ],
    correct: 0,
    explain: 'Standard ASCII uses 7 bits to encode 128 (2^7) distinct characters. Extended ASCII uses 8 bits.'
  },
  {
    id: 'tcat-cs-5',
    subject: 'Computer Science',
    topic: 'Computer Fundamentals',
    difficulty: 'Easy',
    q: 'Which CPU register holds the memory address of the very next instruction to be fetched and executed?',
    options: [
      'Program Counter (PC)',
      'Memory Address Register (MAR)',
      'Instruction Register (IR)',
      'Accumulator (ACC)'
    ],
    correct: 0,
    explain: 'The Program Counter (PC) stores the memory location of the next sequential instruction and increments after each fetch cycle.'
  },
  {
    id: 'tcat-cs-6',
    subject: 'Computer Science',
    topic: 'Computer Fundamentals',
    difficulty: 'Medium',
    q: 'In an 8-bit two\'s complement binary representation, what decimal value does the bit pattern 11110100 represent?',
    options: [
      '-12',
      '-116',
      '-20',
      '+244'
    ],
    correct: 0,
    explain: 'Sign bit is 1 (negative). Invert bits: 00001011. Add 1: 00001100 = 12. Therefore, 11110100 represents -12.'
  },
  {
    id: 'tcat-cs-7',
    subject: 'Computer Science',
    topic: 'Computer Fundamentals',
    difficulty: 'Medium',
    q: 'Convert the hexadecimal number (2F)₁₆ to its octal equivalent:',
    options: [
      '(57)₈',
      '(47)₈',
      '(67)₈',
      '(53)₈'
    ],
    correct: 0,
    explain: '(2F)₁₆ in binary is 0010 1111. Group in 3s from the right: 000 101 111 = 0 5 7 = (57)₈.'
  },
  {
    id: 'tcat-cs-8',
    subject: 'Computer Science',
    topic: 'Computer Fundamentals',
    difficulty: 'Medium',
    q: 'Why does Dynamic RAM (DRAM) require periodic electrical refreshing, unlike Static RAM (SRAM)?',
    options: [
      'DRAM cells store charge in microscopic capacitors that leak charge over time',
      'DRAM uses bistable flip-flops that invert states without external voltage',
      'DRAM magnetic domains lose polarity rapidly at room temperature',
      'DRAM operates at higher optical clock frequencies than SRAM'
    ],
    correct: 0,
    explain: 'A DRAM storage cell consists of a single transistor and capacitor; charge leaks from the capacitor, requiring periodic refresh cycles.'
  },
  {
    id: 'tcat-cs-9',
    subject: 'Computer Science',
    topic: 'Computer Fundamentals',
    difficulty: 'Medium',
    q: 'If a microprocessor has a 32-bit memory address bus, what is the maximum directly addressable physical memory capacity?',
    options: [
      '4 Gigabytes (4 GB)',
      '2 Gigabytes (2 GB)',
      '16 Gigabytes (16 GB)',
      '64 Gigabytes (64 GB)'
    ],
    correct: 0,
    explain: '2^32 addressable bytes = 4,294,967,296 bytes = 4 GB.'
  },
  {
    id: 'tcat-cs-10',
    subject: 'Computer Science',
    topic: 'Computer Fundamentals',
    difficulty: 'Medium',
    q: 'Which system software translates an entire high-level source code program into machine language object code in a single comprehensive pass before execution?',
    options: [
      'Compiler',
      'Interpreter',
      'Assembler',
      'Linker'
    ],
    correct: 0,
    explain: 'A compiler translates source code into object code in one complete process, generating an executable; an interpreter translates line-by-line during runtime.'
  },
  {
    id: 'tcat-cs-11',
    subject: 'Computer Science',
    topic: 'Computer Fundamentals',
    difficulty: 'Hard',
    q: 'During the instruction execution cycle, what specific sequence of register transfers occurs during the Fetch phase?',
    options: [
      'MAR ← [PC], Memory Read, MDR ← M[MAR], IR ← [MDR], PC ← [PC] + 1',
      'IR ← [PC], MAR ← [IR], MDR ← M[MAR], PC ← [PC] + 1',
      'MDR ← [PC], MAR ← [MDR], Memory Write, PC ← [PC] + 1',
      'PC ← [MAR], IR ← M[PC], MDR ← [IR], MAR ← [MAR] + 1'
    ],
    correct: 0,
    explain: 'Fetch: PC is loaded into MAR, a read bus cycle loads instruction from memory to MDR, MDR transfers to IR, and PC increments.'
  },
  {
    id: 'tcat-cs-12',
    subject: 'Computer Science',
    topic: 'Computer Fundamentals',
    difficulty: 'Hard',
    q: 'What is the range of signed integer values that can be represented using an n-bit two\'s complement binary numbering system?',
    options: [
      '-2^(n-1) to +2^(n-1) - 1',
      '-2^n to +2^n - 1',
      '-(2^(n-1) - 1) to +2^(n-1) - 1',
      '-2^(n-1) to +2^(n-1)'
    ],
    correct: 0,
    explain: 'For n bits, two\'s complement represents values from -2^(n-1) up to 2^(n-1) - 1. For example, 8 bits yields -128 to +127.'
  },
  {
    id: 'tcat-cs-13',
    subject: 'Computer Science',
    topic: 'Computer Fundamentals',
    difficulty: 'Hard',
    q: 'In CPU cache design, what occurs during a "write-back" policy when the processor modifies a cached memory block?',
    options: [
      'The block is updated only in cache; main memory is updated only when the cache line is evicted',
      'Every cache write simultaneously updates both the cache block and main memory',
      'The write bypasses the cache entirely and writes directly to main RAM',
      'All other CPU cores instantly invalidate their entire cache hierarchy'
    ],
    correct: 0,
    explain: 'In write-back, modifications are made only to cache and marked "dirty"; the block is written to main memory only upon replacement/eviction.'
  },
  {
    id: 'tcat-cs-14',
    subject: 'Computer Science',
    topic: 'Computer Fundamentals',
    difficulty: 'Hard',
    q: 'Which DMA (Direct Memory Access) transfer mode releases the system bus to the CPU for one bus cycle between consecutive byte transfers?',
    options: [
      'Cycle Stealing Mode',
      'Burst Transfer Mode',
      'Block Transfer Mode',
      'Transparent / Demand Mode'
    ],
    correct: 0,
    explain: 'In cycle stealing, the DMA controller takes control of the system bus for a single word transfer and then surrenders it back to the CPU.'
  },
  {
    id: 'tcat-cs-15',
    subject: 'Computer Science',
    topic: 'Computer Fundamentals',
    difficulty: 'Hard',
    q: 'In IEEE 754 32-bit single-precision floating point format, how many bits are allocated to the Sign, Exponent, and Mantissa (fraction) respectively?',
    options: [
      '1 bit Sign, 8 bits Exponent, 23 bits Mantissa',
      '1 bit Sign, 11 bits Exponent, 20 bits Mantissa',
      '2 bits Sign, 7 bits Exponent, 23 bits Mantissa',
      '1 bit Sign, 16 bits Exponent, 15 bits Mantissa'
    ],
    correct: 0,
    explain: 'Single-precision IEEE 754 allocates 1 sign bit, 8 exponent bits (with bias 127), and 23 fractional mantissa bits.'
  },

  // ============================================
  // CHAPTER 2: Programming Fundamentals (15 MCQs)
  // ============================================
  {
    id: 'tcat-cs-16',
    subject: 'Computer Science',
    topic: 'Programming Fundamentals',
    difficulty: 'Easy',
    q: 'In C++, what is the size of the standard `char` data type in bytes?',
    options: [
      '1 byte',
      '2 bytes',
      '4 bytes',
      '8 bytes'
    ],
    correct: 0,
    explain: 'In C++, `sizeof(char)` is strictly defined to be exactly 1 byte (8 bits).'
  },
  {
    id: 'tcat-cs-17',
    subject: 'Computer Science',
    topic: 'Programming Fundamentals',
    difficulty: 'Easy',
    q: 'Which loop structure in C++ is guaranteed to execute its body at least once, even if the condition is initially false?',
    options: [
      'do-while loop',
      'while loop',
      'for loop',
      'nested for loop'
    ],
    correct: 0,
    explain: 'A `do-while` loop evaluates its condition at the bottom (post-test), guaranteeing at least one execution.'
  },
  {
    id: 'tcat-cs-18',
    subject: 'Computer Science',
    topic: 'Programming Fundamentals',
    difficulty: 'Easy',
    q: 'What is the correct syntax for declaring a pointer variable `ptr` to an integer in C++?',
    options: [
      'int *ptr;',
      'int &ptr;',
      'int ptr*;',
      'pointer<int> ptr;'
    ],
    correct: 0,
    explain: 'In C++, `int *ptr;` declares `ptr` as a pointer to an integer memory address.'
  },
  {
    id: 'tcat-cs-19',
    subject: 'Computer Science',
    topic: 'Programming Fundamentals',
    difficulty: 'Easy',
    q: 'What is the index of the last element in a 0-indexed C++ array declared as `int arr[10];`?',
    options: [
      '9',
      '10',
      '11',
      '8'
    ],
    correct: 0,
    explain: 'For an array of size N in C++, valid indices range from 0 to N - 1. For size 10, the last index is 9.'
  },
  {
    id: 'tcat-cs-20',
    subject: 'Computer Science',
    topic: 'Programming Fundamentals',
    difficulty: 'Easy',
    q: 'In object-oriented programming, which access specifier makes class members accessible only within the class itself and its friend functions?',
    options: [
      'private',
      'protected',
      'public',
      'internal'
    ],
    correct: 0,
    explain: 'The `private` access specifier restricts visibility to member functions and friend declarations of the same class.'
  },
  {
    id: 'tcat-cs-21',
    subject: 'Computer Science',
    topic: 'Programming Fundamentals',
    difficulty: 'Medium',
    q: 'What is the output of the following C++ code snippet?\nint a = 5, b = 2;\nfloat c = a / b;\ncout << c;',
    options: [
      '2',
      '2.5',
      '2.0',
      'Compilation Error'
    ],
    correct: 0,
    explain: 'Both `a` and `b` are integers, so integer division `5 / 2` evaluates to `2`. When assigned to float `c`, it becomes `2` (printed as 2).'
  },
  {
    id: 'tcat-cs-22',
    subject: 'Computer Science',
    topic: 'Programming Fundamentals',
    difficulty: 'Medium',
    q: 'Consider the expression `x = 5; y = ++x + x++;`. What are the final values of `x` and `y` in standard evaluation order?',
    options: [
      'x = 7, y = 12',
      'x = 6, y = 11',
      'x = 7, y = 11',
      'x = 6, y = 12'
    ],
    correct: 0,
    explain: '`++x` pre-increments x to 6. Then `6 + 6` gives 12 for y, and `x++` post-increments x from 6 to 7.'
  },
  {
    id: 'tcat-cs-23',
    subject: 'Computer Science',
    topic: 'Programming Fundamentals',
    difficulty: 'Medium',
    q: 'What distinguishes passing parameters "by reference" (`void func(int &x)`) from passing "by value" in C++?',
    options: [
      'Pass by reference passes the original variable\'s memory alias, allowing modifications to affect the caller\'s variable',
      'Pass by reference creates a complete duplicate copy on the call stack',
      'Pass by reference can only accept compile-time literal constant arguments',
      'Pass by reference restricts the function from modifying the parameter value'
    ],
    correct: 0,
    explain: 'Passing by reference passes an alias to the caller\'s variable, eliminating copying overhead and permitting in-place modifications.'
  },
  {
    id: 'tcat-cs-24',
    subject: 'Computer Science',
    topic: 'Programming Fundamentals',
    difficulty: 'Medium',
    q: 'In C++, what occurs when a class allocates dynamic heap memory via `new` in its constructor but does not implement a destructor with `delete`?',
    options: [
      'A memory leak occurs because allocated heap memory is never freed when the object goes out of scope',
      'The operating system automatically garbage-collects the memory immediately',
      'A compile-time syntax error is generated by the compiler',
      'The heap memory is converted into static read-only data segment storage'
    ],
    correct: 0,
    explain: 'C++ lacks automatic garbage collection; unreleased heap memory allocated with `new` results in a memory leak upon object destruction.'
  },
  {
    id: 'tcat-cs-25',
    subject: 'Computer Science',
    topic: 'Programming Fundamentals',
    difficulty: 'Medium',
    q: 'What is the base case in a recursive function responsible for?',
    options: [
      'Terminating recursive calls and preventing infinite recursion and stack overflow',
      'Allocating dynamic memory on the system free store',
      'Converting recursive logic into an iterative loop at compile time',
      'Generating the initial seed value for pseudo-random number generators'
    ],
    correct: 0,
    explain: 'The base case provides a direct answer without further recursion, stopping the call stack from growing infinitely.'
  },
  {
    id: 'tcat-cs-26',
    subject: 'Computer Science',
    topic: 'Programming Fundamentals',
    difficulty: 'Hard',
    q: 'In C++, what does declaring a member function as `virtual` achieve in an inheritance hierarchy?',
    options: [
      'It enables dynamic (late) binding, dispatching the function call at runtime based on the actual object type via the vtable',
      'It forces the function to be resolved strictly at compile time for maximum inlining speed',
      'It prevents derived classes from overriding the function implementation',
      'It restricts the member function to only access static class member variables'
    ],
    correct: 0,
    explain: '`virtual` member functions use runtime polymorphism (virtual method table / vtable) to resolve calls based on the runtime type of the pointed-to object.'
  },
  {
    id: 'tcat-cs-27',
    subject: 'Computer Science',
    topic: 'Programming Fundamentals',
    difficulty: 'Hard',
    q: 'What will be printed by the following pointer arithmetic in C++?\nint arr[] = {10, 20, 30, 40, 50};\nint *p = arr + 1;\ncout << *(p + 2);',
    options: [
      '40',
      '30',
      '20',
      '50'
    ],
    correct: 0,
    explain: '`p = arr + 1` points to index 1 (value 20). `p + 2` points to index 1 + 2 = 3 (value 40). `*(p + 2)` dereferences to 40.'
  },
  {
    id: 'tcat-cs-28',
    subject: 'Computer Science',
    topic: 'Programming Fundamentals',
    difficulty: 'Hard',
    q: 'What is the purpose of a "copy constructor" in C++ when a class encapsulates raw pointer members pointing to dynamic heap memory?',
    options: [
      'To perform a deep copy by allocating distinct memory and duplicating data, avoiding double-free corruption',
      'To perform a shallow bitwise copy of pointer addresses directly',
      'To prevent the object from ever being passed into another function',
      'To automatically serialize the object state into an external binary file'
    ],
    correct: 0,
    explain: 'A user-defined copy constructor creates a deep copy so both objects manage independent heap allocations, preventing shared dangling pointers.'
  },
  {
    id: 'tcat-cs-29',
    subject: 'Computer Science',
    topic: 'Programming Fundamentals',
    difficulty: 'Hard',
    q: 'What does the `const` keyword signify when placed at the end of a member function declaration: `int getValue() const;`?',
    options: [
      'The member function promises not to modify any non-mutable member variables of the calling object',
      'The function returns a constant integer reference that cannot be reassigned',
      'The function can only be invoked by static utility methods',
      'The compiler must execute the function during compilation as a constexpr'
    ],
    correct: 0,
    explain: 'A const member function treats `this` as a pointer to const, guaranteeing it does not alter object member state.'
  },
  {
    id: 'tcat-cs-30',
    subject: 'Computer Science',
    topic: 'Programming Fundamentals',
    difficulty: 'Hard',
    q: 'What is the computational time complexity of calculating Fibonacci numbers using the naive recursive function `fib(n) = fib(n-1) + fib(n-2)` without memoization?',
    options: [
      'O(2^n)',
      'O(n)',
      'O(n log n)',
      'O(n^2)'
    ],
    correct: 0,
    explain: 'The recursion tree doubles at every level, creating approximately 2^n function calls, which is exponential O(2^n) time.'
  },

  // ============================================
  // CHAPTER 3: Data Structures Basics (15 MCQs)
  // ============================================
  {
    id: 'tcat-cs-31',
    subject: 'Computer Science',
    topic: 'Data Structures Basics',
    difficulty: 'Easy',
    q: 'Which data structure operates strictly on the Last-In, First-Out (LIFO) access principle?',
    options: [
      'Stack',
      'Queue',
      'Linked List',
      'Binary Search Tree'
    ],
    correct: 0,
    explain: 'A stack follows LIFO (Last-In, First-Out): the most recently added element is the first one popped.'
  },
  {
    id: 'tcat-cs-32',
    subject: 'Computer Science',
    topic: 'Data Structures Basics',
    difficulty: 'Easy',
    q: 'Which operation on a linear array takes O(1) constant time, assuming valid bounds?',
    options: [
      'Direct index-based access (arr[i])',
      'Searching for an unsorted target value',
      'Inserting an element at the beginning',
      'Deleting an element from the middle'
    ],
    correct: 0,
    explain: 'Arrays provide contiguous memory locations, allowing address calculation `base + i * size` in O(1) constant time.'
  },
  {
    id: 'tcat-cs-33',
    subject: 'Computer Science',
    topic: 'Data Structures Basics',
    difficulty: 'Easy',
    q: 'In a standard First-In, First-Out (FIFO) queue, at which end are new elements inserted?',
    options: [
      'Rear (Tail)',
      'Front (Head)',
      'Middle',
      'Both ends simultaneously'
    ],
    correct: 0,
    explain: 'In a standard queue, insertions (enqueue) occur at the rear/tail, and deletions (dequeue) occur at the front/head.'
  },
  {
    id: 'tcat-cs-34',
    subject: 'Computer Science',
    topic: 'Data Structures Basics',
    difficulty: 'Easy',
    q: 'What does the `next` pointer of the last node in a standard singly linked list contain?',
    options: [
      'NULL (or nullptr)',
      'Address of the head node',
      'Address of the previous node',
      'Garbage value'
    ],
    correct: 0,
    explain: 'The terminal node in a singly linked list points to NULL (nullptr) to indicate the end of the chain.'
  },
  {
    id: 'tcat-cs-35',
    subject: 'Computer Science',
    topic: 'Data Structures Basics',
    difficulty: 'Easy',
    q: 'What prerequisite must a collection satisfy before Binary Search can be applied to it?',
    options: [
      'The elements must be sorted in ascending or descending order',
      'The collection must be stored in a linked list',
      'The collection size must be an exact power of two',
      'All elements must be distinct positive integers'
    ],
    correct: 0,
    explain: 'Binary Search relies on dividing search ranges based on comparisons, which requires the elements to be sorted.'
  },
  {
    id: 'tcat-cs-36',
    subject: 'Computer Science',
    topic: 'Data Structures Basics',
    difficulty: 'Medium',
    q: 'What is the equivalent Postfix (Reverse Polish) expression for the Infix arithmetic expression: `(A + B) * (C - D)`?',
    options: [
      'A B + C D - *',
      'A B C D + - *',
      '* + A B - C D',
      'A B + * C D -'
    ],
    correct: 0,
    explain: '`(A + B)` becomes `A B +`. `(C - D)` becomes `C D -`. Multiplying them yields `A B + C D - *`.'
  },
  {
    id: 'tcat-cs-37',
    subject: 'Computer Science',
    topic: 'Data Structures Basics',
    difficulty: 'Medium',
    q: 'In an array-based Circular Queue of size N, what formula is used to advance the `rear` pointer during an enqueue operation?',
    options: [
      'rear = (rear + 1) % N',
      'rear = rear + 1',
      'rear = (rear - 1) % N',
      'rear = (front + rear) % N'
    ],
    correct: 0,
    explain: 'Modulo arithmetic `(rear + 1) % N` wraps the index back to 0 when it reaches the end of the allocated array.'
  },
  {
    id: 'tcat-cs-38',
    subject: 'Computer Science',
    topic: 'Data Structures Basics',
    difficulty: 'Medium',
    q: 'What is the worst-case time complexity of inserting a new node at the very beginning (head) of a singly linked list with N nodes?',
    options: [
      'O(1)',
      'O(N)',
      'O(log N)',
      'O(N^2)'
    ],
    correct: 0,
    explain: 'Inserting at head simply sets newNode->next = head and head = newNode, requiring no traversal, hence O(1).'
  },
  {
    id: 'tcat-cs-39',
    subject: 'Computer Science',
    topic: 'Data Structures Basics',
    difficulty: 'Medium',
    q: 'What is the worst-case number of comparisons performed by Linear Search on an array containing N elements?',
    options: [
      'N comparisons',
      'log₂(N) comparisons',
      'N / 2 comparisons',
      'N log₂(N) comparisons'
    ],
    correct: 0,
    explain: 'If the target is at the very last position or absent, linear search inspects every element, requiring N comparisons.'
  },
  {
    id: 'tcat-cs-40',
    subject: 'Computer Science',
    topic: 'Data Structures Basics',
    difficulty: 'Medium',
    q: 'What is the average-case time complexity of Bubble Sort when sorting an array of N elements?',
    options: [
      'O(N^2)',
      'O(N log N)',
      'O(N)',
      'O(log N)'
    ],
    correct: 0,
    explain: 'Bubble sort requires nested loops with roughly N(N-1)/2 comparisons, yielding O(N^2) average and worst-case complexity.'
  },
  {
    id: 'tcat-cs-41',
    subject: 'Computer Science',
    topic: 'Data Structures Basics',
    difficulty: 'Hard',
    q: 'Given an array of size 1024 elements, what is the maximum number of key comparisons needed to locate an item using Binary Search?',
    options: [
      '11 comparisons',
      '10 comparisons',
      '512 comparisons',
      '1024 comparisons'
    ],
    correct: 0,
    explain: 'Binary search performs at most ⌊log₂(N)⌋ + 1 comparisons. For N = 1024, log₂(1024) = 10; thus at most 11 comparisons.'
  },
  {
    id: 'tcat-cs-42',
    subject: 'Computer Science',
    topic: 'Data Structures Basics',
    difficulty: 'Hard',
    q: 'When evaluating the postfix expression `6 2 3 + * 4 -` using a stack, what is the final calculated result?',
    options: [
      '26',
      '16',
      '30',
      '24'
    ],
    correct: 0,
    explain: 'Stack: push 6, push 2, push 3. Encounter +: 2 + 3 = 5, push 5. Encounter *: 6 * 5 = 30, push 30. Push 4. Encounter -: 30 - 4 = 26.'
  },
  {
    id: 'tcat-cs-43',
    subject: 'Computer Science',
    topic: 'Data Structures Basics',
    difficulty: 'Hard',
    q: 'What is a fundamental structural advantage of a Doubly Linked List over a Singly Linked List?',
    options: [
      'Given a pointer to an arbitrary node, it can be deleted in O(1) time without traversing from the head',
      'It consumes less total memory per node than a singly linked list',
      'It supports O(1) random index-based element access',
      'It eliminates the need for dynamic heap memory allocation'
    ],
    correct: 0,
    explain: 'Because each node has `prev` and `next` pointers, a node can unlink itself in O(1) time without requiring a traversal to find its predecessor.'
  },
  {
    id: 'tcat-cs-44',
    subject: 'Computer Science',
    topic: 'Data Structures Basics',
    difficulty: 'Hard',
    q: 'Which sorting algorithm has a guaranteed worst-case time complexity of O(N log N) while maintaining sorting stability?',
    options: [
      'Merge Sort',
      'Quick Sort',
      'Heap Sort',
      'Selection Sort'
    ],
    correct: 0,
    explain: 'Merge Sort consistently achieves O(N log N) time in best, average, and worst cases, and is stable when merges break ties favoring earlier elements.'
  },
  {
    id: 'tcat-cs-45',
    subject: 'Computer Science',
    topic: 'Data Structures Basics',
    difficulty: 'Hard',
    q: 'What condition indicates that an array-based Circular Queue of capacity N (using front and rear indices with one empty slot reserved) is completely full?',
    options: [
      '(rear + 1) % N == front',
      'rear == front',
      'rear == N - 1',
      '(front + 1) % N == rear'
    ],
    correct: 0,
    explain: 'Reserving one slot distinguishes full from empty: `(rear + 1) % N == front` signifies full, while `rear == front` signifies empty.'
  },

  // ====================================================
  // CHAPTER 4: Boolean Algebra & Logic Gates (15 MCQs)
  // ====================================================
  {
    id: 'tcat-cs-46',
    subject: 'Computer Science',
    topic: 'Boolean Algebra & Logic Gates',
    difficulty: 'Easy',
    q: 'Which logic gate produces an output of logic 1 ONLY when all of its inputs are logic 1?',
    options: [
      'AND gate',
      'OR gate',
      'XOR gate',
      'NAND gate'
    ],
    correct: 0,
    explain: 'An AND gate outputs 1 strictly when every input is simultaneously 1.'
  },
  {
    id: 'tcat-cs-47',
    subject: 'Computer Science',
    topic: 'Boolean Algebra & Logic Gates',
    difficulty: 'Easy',
    q: 'Which pair of logic gates are designated as "Universal Gates" because any Boolean logic function can be constructed using only that gate type?',
    options: [
      'NAND and NOR',
      'AND and OR',
      'XOR and XNOR',
      'NOT and AND'
    ],
    correct: 0,
    explain: 'NAND and NOR gates are universal gates because functional completeness allows NOT, AND, and OR to be constructed entirely from them.'
  },
  {
    id: 'tcat-cs-48',
    subject: 'Computer Science',
    topic: 'Boolean Algebra & Logic Gates',
    difficulty: 'Easy',
    q: 'According to Boolean algebra theorems, what does the expression `A + A\'` evaluate to?',
    options: [
      '1',
      '0',
      'A',
      'A\''
    ],
    correct: 0,
    explain: 'By the law of complementarity, a variable ORed with its complement always equals logic 1 (true).'
  },
  {
    id: 'tcat-cs-49',
    subject: 'Computer Science',
    topic: 'Boolean Algebra & Logic Gates',
    difficulty: 'Easy',
    q: 'What is the output of a 2-input XOR gate when both inputs are identical (either both 0 or both 1)?',
    options: [
      '0',
      '1',
      'High impedance',
      'Oscillating output'
    ],
    correct: 0,
    explain: 'An XOR gate outputs 1 only when inputs differ. When inputs are identical (0,0 or 1,1), the output is 0.'
  },
  {
    id: 'tcat-cs-50',
    subject: 'Computer Science',
    topic: 'Boolean Algebra & Logic Gates',
    difficulty: 'Easy',
    q: 'What are the two outputs generated by a Half Adder circuit when adding two single-bit binary inputs A and B?',
    options: [
      'Sum = A ⊕ B, Carry = A • B',
      'Sum = A • B, Carry = A + B',
      'Sum = A + B, Carry = A ⊕ B',
      'Sum = (A • B)\', Carry = A ⊕ B'
    ],
    correct: 0,
    explain: 'A half adder computes Sum using an XOR gate (A ⊕ B) and Carry using an AND gate (A • B).'
  },
  {
    id: 'tcat-cs-51',
    subject: 'Computer Science',
    topic: 'Boolean Algebra & Logic Gates',
    difficulty: 'Medium',
    q: 'According to De Morgan\'s First Law, what is the equivalent expression for `(A • B)\'`?',
    options: [
      'A\' + B\'',
      'A\' • B\'',
      'A + B',
      '(A + B)\''
    ],
    correct: 0,
    explain: 'De Morgan\'s theorem states that the complement of a product is the sum of complements: (A • B)\' = A\' + B\'.'
  },
  {
    id: 'tcat-cs-52',
    subject: 'Computer Science',
    topic: 'Boolean Algebra & Logic Gates',
    difficulty: 'Medium',
    q: 'Simplify the Boolean algebraic expression: `F = A • B + A • B\'`:',
    options: [
      'A',
      'B',
      '1',
      'A • B'
    ],
    correct: 0,
    explain: 'Factoring gives A • (B + B\'). Since B + B\' = 1, F = A • 1 = A.'
  },
  {
    id: 'tcat-cs-53',
    subject: 'Computer Science',
    topic: 'Boolean Algebra & Logic Gates',
    difficulty: 'Medium',
    q: 'How many distinct cells are present in a Karnaugh Map (K-map) designed for 4 Boolean variables?',
    options: [
      '16 cells',
      '8 cells',
      '32 cells',
      '64 cells'
    ],
    correct: 0,
    explain: 'A K-map with n variables contains 2^n cells. For 4 variables, 2^4 = 16 cells.'
  },
  {
    id: 'tcat-cs-54',
    subject: 'Computer Science',
    topic: 'Boolean Algebra & Logic Gates',
    difficulty: 'Medium',
    q: 'Why does a Karnaugh Map use Gray Code ordering (00, 01, 11, 10) for adjacent rows and columns?',
    options: [
      'To ensure that adjacent cells differ by only one single bit change, enabling visual minimization',
      'To follow standard binary counting sequences for digital arithmetic',
      'To maximize the electrical propagation speed across silicon tracks',
      'To allow negative numbers to be plotted directly on the grid'
    ],
    correct: 0,
    explain: 'Gray code ensures adjacent cells change by exactly one variable, allowing groupings to eliminate variables algebraically.'
  },
  {
    id: 'tcat-cs-55',
    subject: 'Computer Science',
    topic: 'Boolean Algebra & Logic Gates',
    difficulty: 'Medium',
    q: 'How many two-input NAND gates are minimally required to construct a single two-input OR gate?',
    options: [
      '3 NAND gates',
      '2 NAND gates',
      '4 NAND gates',
      '5 NAND gates'
    ],
    correct: 0,
    explain: 'A OR B = (A\' • B\')\'. Two NAND gates invert A and B (A\' and B\'), and a third NAND gate combines A\' and B\', yielding 3 gates total.'
  },
  {
    id: 'tcat-cs-56',
    subject: 'Computer Science',
    topic: 'Boolean Algebra & Logic Gates',
    difficulty: 'Hard',
    q: 'What is the minimized Sum of Products (SOP) expression for `F(A, B, C) = ∑m(0, 2, 4, 6)`?',
    options: [
      'C\'',
      'A\'',
      'B\'',
      'A\' • C\''
    ],
    correct: 0,
    explain: 'Minterms: 000, 010, 100, 110. Notice C is 0 in all four minterms, while A and B take all 4 combinations. Grouping all 4 eliminates A and B, yielding C\'.'
  },
  {
    id: 'tcat-cs-57',
    subject: 'Computer Science',
    topic: 'Boolean Algebra & Logic Gates',
    difficulty: 'Hard',
    q: 'In Boolean algebra, what does the Absorption Law state regarding the expression `A + A • B`?',
    options: [
      'A + A • B = A',
      'A + A • B = B',
      'A + A • B = A + B',
      'A + A • B = 1'
    ],
    correct: 0,
    explain: 'By factoring: A • (1 + B). Since 1 + B = 1, A • 1 = A. This is the fundamental Absorption Law.'
  },
  {
    id: 'tcat-cs-58',
    subject: 'Computer Science',
    topic: 'Boolean Algebra & Logic Gates',
    difficulty: 'Hard',
    q: 'How can a Full Adder circuit be constructed using Half Adders and basic logic gates?',
    options: [
      '2 Half Adders and 1 OR gate',
      '2 Half Adders and 1 AND gate',
      '3 Half Adders and 1 XOR gate',
      '2 Half Adders and 1 NOR gate'
    ],
    correct: 0,
    explain: 'A full adder uses two half adders (one for A+B, one to add Cin) and one OR gate to combine their carry outputs.'
  },
  {
    id: 'tcat-cs-59',
    subject: 'Computer Science',
    topic: 'Boolean Algebra & Logic Gates',
    difficulty: 'Hard',
    q: 'Simplify the Boolean function `F = (A + B) • (A + B\')` to its minimal form:',
    options: [
      'A',
      'B',
      'A + B',
      '0'
    ],
    correct: 0,
    explain: 'Using distributive law: (A + B)(A + B\') = A + (B • B\'). Since B • B\' = 0, F = A + 0 = A.'
  },
  {
    id: 'tcat-cs-60',
    subject: 'Computer Science',
    topic: 'Boolean Algebra & Logic Gates',
    difficulty: 'Hard',
    q: 'What is the boolean function implemented by a 2-to-1 Multiplexer (MUX) with data inputs I₀ and I₁, and select line S?',
    options: [
      'Y = S\' • I₀ + S • I₁',
      'Y = S • I₀ + S\' • I₁',
      'Y = (S ⊕ I₀) • I₁',
      'Y = S\' • I₀\' + S • I₁\''
    ],
    correct: 0,
    explain: 'When S = 0, S\' = 1 and I₀ is passed. When S = 1, S = 1 and I₁ is passed. Hence Y = S\' • I₀ + S • I₁.'
  },

  // ===================================================
  // CHAPTER 5: Computer Networks & Internet (15 MCQs)
  // ===================================================
  {
    id: 'tcat-cs-61',
    subject: 'Computer Science',
    topic: 'Computer Networks & Internet',
    difficulty: 'Easy',
    q: 'How many layers are defined in the standard ISO-OSI reference model?',
    options: [
      '7 layers',
      '4 layers',
      '5 layers',
      '6 layers'
    ],
    correct: 0,
    explain: 'The OSI model consists of 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application.'
  },
  {
    id: 'tcat-cs-62',
    subject: 'Computer Science',
    topic: 'Computer Networks & Internet',
    difficulty: 'Easy',
    q: 'Which network topology connects all nodes to a central connecting device such as a switch or hub?',
    options: [
      'Star Topology',
      'Bus Topology',
      'Ring Topology',
      'Mesh Topology'
    ],
    correct: 0,
    explain: 'In a Star topology, all peripheral devices connect via dedicated point-to-point cables directly to a central hub/switch.'
  },
  {
    id: 'tcat-cs-63',
    subject: 'Computer Science',
    topic: 'Computer Networks & Internet',
    difficulty: 'Easy',
    q: 'What is the length in bits of an IPv4 address compared to an IPv6 address?',
    options: [
      'IPv4 is 32 bits, IPv6 is 128 bits',
      'IPv4 is 64 bits, IPv6 is 128 bits',
      'IPv4 is 16 bits, IPv6 is 64 bits',
      'IPv4 is 32 bits, IPv6 is 64 bits'
    ],
    correct: 0,
    explain: 'IPv4 addresses use 32 bits (4 octets); IPv6 addresses use 128 bits (represented in hexadecimal).'
  },
  {
    id: 'tcat-cs-64',
    subject: 'Computer Science',
    topic: 'Computer Networks & Internet',
    difficulty: 'Easy',
    q: 'Which protocol is responsible for resolving a known domain name (like www.google.com) into its corresponding numerical IP address?',
    options: [
      'DNS (Domain Name System)',
      'DHCP (Dynamic Host Configuration Protocol)',
      'ARP (Address Resolution Protocol)',
      'FTP (File Transfer Protocol)'
    ],
    correct: 0,
    explain: 'DNS translates human-readable domain names into machine-routable IP addresses.'
  },
  {
    id: 'tcat-cs-65',
    subject: 'Computer Science',
    topic: 'Computer Networks & Internet',
    difficulty: 'Easy',
    q: 'At which layer of the OSI model does a Router operate to forward data packets between distinct networks?',
    options: [
      'Network Layer (Layer 3)',
      'Data Link Layer (Layer 2)',
      'Transport Layer (Layer 4)',
      'Physical Layer (Layer 1)'
    ],
    correct: 0,
    explain: 'Routers inspect logical network addresses (IP) and make routing decisions at OSI Layer 3 (Network Layer).'
  },
  {
    id: 'tcat-cs-66',
    subject: 'Computer Science',
    topic: 'Computer Networks & Internet',
    difficulty: 'Medium',
    q: 'What is the key functional difference between TCP and UDP at the Transport layer?',
    options: [
      'TCP is connection-oriented and provides reliable delivery with retransmission; UDP is connectionless and faster',
      'TCP operates at Layer 3; UDP operates at Layer 4',
      'TCP is used strictly for multimedia streaming; UDP is used for web pages',
      'TCP does not support error detection; UDP guarantees in-order delivery'
    ],
    correct: 0,
    explain: 'TCP provides reliable, sequenced delivery with flow control and retransmissions. UDP is lightweight and connectionless.'
  },
  {
    id: 'tcat-cs-67',
    subject: 'Computer Science',
    topic: 'Computer Networks & Internet',
    difficulty: 'Medium',
    q: 'Which protocol maps a known Layer 3 logical IP address to a Layer 2 physical MAC address on a local area network?',
    options: [
      'ARP (Address Resolution Protocol)',
      'RARP (Reverse ARP)',
      'ICMP (Internet Control Message Protocol)',
      'NAT (Network Address Translation)'
    ],
    correct: 0,
    explain: 'ARP broadcasts queries on the local network to find the hardware MAC address corresponding to a target IP address.'
  },
  {
    id: 'tcat-cs-68',
    subject: 'Computer Science',
    topic: 'Computer Networks & Internet',
    difficulty: 'Medium',
    q: 'What is the default subnet mask for a standard Class B IPv4 network?',
    options: [
      '255.255.0.0',
      '255.0.0.0',
      '255.255.255.0',
      '255.255.255.255'
    ],
    correct: 0,
    explain: 'Class B addresses use 16 network bits and 16 host bits, giving the default subnet mask 255.255.0.0 (/16).'
  },
  {
    id: 'tcat-cs-69',
    subject: 'Computer Science',
    topic: 'Computer Networks & Internet',
    difficulty: 'Medium',
    q: 'In a full mesh topology containing N nodes, how many physical communication links are required to interconnect all nodes?',
    options: [
      'N(N - 1) / 2 links',
      'N - 1 links',
      'N links',
      'N^2 links'
    ],
    correct: 0,
    explain: 'Every node connects to every other node without repetition: N(N - 1) / 2 duplex links.'
  },
  {
    id: 'tcat-cs-70',
    subject: 'Computer Science',
    topic: 'Computer Networks & Internet',
    difficulty: 'Medium',
    q: 'Which networking device operates at Layer 2 (Data Link) to filter and forward frames based on hardware MAC addresses?',
    options: [
      'Switch',
      'Hub',
      'Repeater',
      'Gateway'
    ],
    correct: 0,
    explain: 'A network switch learns MAC addresses from incoming frames and forwards frames specifically to the destination port (Layer 2).'
  },
  {
    id: 'tcat-cs-71',
    subject: 'Computer Science',
    topic: 'Computer Networks & Internet',
    difficulty: 'Hard',
    q: 'Given the IPv4 address `192.168.10.65` with subnet mask `255.255.255.192` (/26), what is the Network Address for this subnet?',
    options: [
      '192.168.10.64',
      '192.168.10.0',
      '192.168.10.32',
      '192.168.10.128'
    ],
    correct: 0,
    explain: 'Subnet mask 192 in binary is 11000000 (block size = 256 - 192 = 64). Subnets are 0, 64, 128, 192. IP 65 falls into the 192.168.10.64 subnet.'
  },
  {
    id: 'tcat-cs-72',
    subject: 'Computer Science',
    topic: 'Computer Networks & Internet',
    difficulty: 'Hard',
    q: 'What is the mechanism of the three-way handshake used by TCP to establish a reliable connection between client and server?',
    options: [
      'SYN → SYN-ACK → ACK',
      'ACK → SYN → ACK',
      'SYN → ACK → FIN',
      'HELO → SYN → ACK'
    ],
    correct: 0,
    explain: 'The client sends SYN; the server replies with SYN-ACK; the client acknowledges with ACK, completing connection establishment.'
  },
  {
    id: 'tcat-cs-73',
    subject: 'Computer Science',
    topic: 'Computer Networks & Internet',
    difficulty: 'Hard',
    q: 'In asymmetric public-key cryptography (such as RSA), how is message confidentiality guaranteed when Alice sends a message to Bob?',
    options: [
      'Alice encrypts the message with Bob\'s Public Key; Bob decrypts it with Bob\'s Private Key',
      'Alice encrypts with Alice\'s Private Key; Bob decrypts with Alice\'s Public Key',
      'Alice encrypts with a shared secret symmetric passphrase transmitted in plaintext',
      'Alice encrypts with Bob\'s Private Key; Bob decrypts with Bob\'s Public Key'
    ],
    correct: 0,
    explain: 'For confidentiality, data is encrypted with the recipient\'s public key; only the recipient\'s matched private key can decrypt it.'
  },
  {
    id: 'tcat-cs-74',
    subject: 'Computer Science',
    topic: 'Computer Networks & Internet',
    difficulty: 'Hard',
    q: 'What does the Time to Live (TTL) field in an IPv4 header prevent?',
    options: [
      'Packets from circulating endlessly in routing loops due to routing misconfigurations',
      'Buffer overflows on receiver network interface cards',
      'Eavesdropping by unauthorized intermediate routers',
      'Unauthorized TCP port scanning attacks'
    ],
    correct: 0,
    explain: 'Each router decrements the TTL by 1; if TTL drops to 0, the packet is discarded and an ICMP Time Exceeded message is returned.'
  },
  {
    id: 'tcat-cs-75',
    subject: 'Computer Science',
    topic: 'Computer Networks & Internet',
    difficulty: 'Hard',
    q: 'In CSMA/CD (Carrier Sense Multiple Access with Collision Detection), what happens when a transmitting station detects an electrical collision?',
    options: [
      'It immediately aborts transmission, broadcasts a jam signal, and waits a random backoff time before retrying',
      'It amplifies its signal power to overwrite the competing station\'s transmission',
      'It switches instantly to full-duplex token ring mode',
      'It drops the packet and reports an unrecoverable hardware fault to the OS'
    ],
    correct: 0,
    explain: 'On detecting a collision, CSMA/CD sends a jam signal to notify all stations, then executes exponential backoff before retransmitting.'
  },

  // =====================================
  // CHAPTER 6: Database Basics (15 MCQs)
  // =====================================
  {
    id: 'tcat-cs-76',
    subject: 'Computer Science',
    topic: 'Database Basics',
    difficulty: 'Easy',
    q: 'In relational database terminology, what is a single row in a relation table formally called?',
    options: [
      'Tuple (or Record)',
      'Attribute',
      'Domain',
      'Schema'
    ],
    correct: 0,
    explain: 'A row in a relational database corresponds to an entity instance and is formally designated as a tuple.'
  },
  {
    id: 'tcat-cs-77',
    subject: 'Computer Science',
    topic: 'Database Basics',
    difficulty: 'Easy',
    q: 'Which column constraint uniquely identifies each row in a table and cannot contain NULL values?',
    options: [
      'PRIMARY KEY',
      'FOREIGN KEY',
      'DEFAULT',
      'CHECK'
    ],
    correct: 0,
    explain: 'A Primary Key enforces unique identification and entity integrity, strictly disallowing NULL entries.'
  },
  {
    id: 'tcat-cs-78',
    subject: 'Computer Science',
    topic: 'Database Basics',
    difficulty: 'Easy',
    q: 'Which SQL keyword is used to retrieve data from one or more database tables?',
    options: [
      'SELECT',
      'EXTRACT',
      'GET',
      'FETCH'
    ],
    correct: 0,
    explain: 'The `SELECT` statement is the foundation of SQL queries for fetching record sets from relations.'
  },
  {
    id: 'tcat-cs-79',
    subject: 'Computer Science',
    topic: 'Database Basics',
    difficulty: 'Easy',
    q: 'What type of key establishes a link between data in two tables by referencing the primary key of another table?',
    options: [
      'Foreign Key',
      'Composite Key',
      'Super Key',
      'Candidate Key'
    ],
    correct: 0,
    explain: 'A Foreign Key creates referential integrity by storing values that correspond to the Primary Key of a parent table.'
  },
  {
    id: 'tcat-cs-80',
    subject: 'Computer Science',
    topic: 'Database Basics',
    difficulty: 'Easy',
    q: 'In an Entity-Relationship (ER) Diagram, what geometric shape is standardly used to represent an Entity?',
    options: [
      'Rectangle',
      'Diamond',
      'Ellipse / Oval',
      'Double Circle'
    ],
    correct: 0,
    explain: 'In standard Chen ER notation, entities are drawn as rectangles, relationships as diamonds, and attributes as ellipses.'
  },
  {
    id: 'tcat-cs-81',
    subject: 'Computer Science',
    topic: 'Database Basics',
    difficulty: 'Medium',
    q: 'What requirement must a database table satisfy to be in First Normal Form (1NF)?',
    options: [
      'All attribute values must be atomic (no repeating groups or multi-valued attributes)',
      'All non-key attributes must be fully functionally dependent on the primary key',
      'No transitive dependencies must exist between non-key attributes',
      'The table must possess at least two foreign key constraints'
    ],
    correct: 0,
    explain: '1NF requires that each column contains only atomic (indivisible) single values, with no repeating groups.'
  },
  {
    id: 'tcat-cs-82',
    subject: 'Computer Science',
    topic: 'Database Basics',
    difficulty: 'Medium',
    q: 'Which clause in an SQL statement is used to filter the aggregated results generated by a `GROUP BY` clause?',
    options: [
      'HAVING',
      'WHERE',
      'FILTER',
      'ORDER BY'
    ],
    correct: 0,
    explain: '`WHERE` filters individual rows prior to aggregation; `HAVING` filters group results after the `GROUP BY` clause.'
  },
  {
    id: 'tcat-cs-83',
    subject: 'Computer Science',
    topic: 'Database Basics',
    difficulty: 'Medium',
    q: 'What is the effect of an SQL `INNER JOIN` between two tables A and B?',
    options: [
      'It returns only the rows where there is an exact matching value in both tables based on the join condition',
      'It returns all rows from table A and only matched rows from table B',
      'It produces a Cartesian product of all rows regardless of matching keys',
      'It merges table structures without comparing data values'
    ],
    correct: 0,
    explain: 'An `INNER JOIN` includes only records that satisfy the match condition in both participating tables.'
  },
  {
    id: 'tcat-cs-84',
    subject: 'Computer Science',
    topic: 'Database Basics',
    difficulty: 'Medium',
    q: 'What does "Referential Integrity" prevent in a relational database management system?',
    options: [
      'Dangling pointers or orphan foreign keys referencing non-existent primary key records',
      'Duplicate primary key entries in the parent table',
      'Storing null values in non-primary key text fields',
      'Concurrent read access during transaction rollbacks'
    ],
    correct: 0,
    explain: 'Referential integrity guarantees that foreign key values must either match an existing parent primary key or be NULL.'
  },
  {
    id: 'tcat-cs-85',
    subject: 'Computer Science',
    topic: 'Database Basics',
    difficulty: 'Medium',
    q: 'Which normal form eliminates partial dependencies where a non-prime attribute depends on only a portion of a composite candidate key?',
    options: [
      'Second Normal Form (2NF)',
      'First Normal Form (1NF)',
      'Third Normal Form (3NF)',
      'Boyce-Codd Normal Form (BCNF)'
    ],
    correct: 0,
    explain: '2NF requires 1NF compliance and mandates that all non-key attributes are fully functionally dependent on the entire primary key.'
  },
  {
    id: 'tcat-cs-86',
    subject: 'Computer Science',
    topic: 'Database Basics',
    difficulty: 'Hard',
    q: 'A table in 2NF has a functional dependency X → Y and Y → Z, where neither X nor Y are candidate keys. What normalization rule is violated?',
    options: [
      'Third Normal Form (3NF), due to a transitive dependency',
      'Second Normal Form (2NF), due to a partial dependency',
      'First Normal Form (1NF), due to non-atomic domains',
      'Boyce-Codd Normal Form (BCNF), due to multi-valued dependencies'
    ],
    correct: 0,
    explain: 'A dependency X → Y → Z where non-key Y determines non-key Z is a transitive dependency, prohibited in 3NF.'
  },
  {
    id: 'tcat-cs-87',
    subject: 'Computer Science',
    topic: 'Database Basics',
    difficulty: 'Hard',
    q: 'What is the ACID property that ensures either all operations of a database transaction execute successfully or none of them take effect?',
    options: [
      'Atomicity',
      'Consistency',
      'Isolation',
      'Durability'
    ],
    correct: 0,
    explain: 'Atomicity treats the transaction as an indivisible unit of work: either all operations commit, or the entire transaction aborts/rolls back.'
  },
  {
    id: 'tcat-cs-88',
    subject: 'Computer Science',
    topic: 'Database Basics',
    difficulty: 'Hard',
    q: 'Given a relational table `Orders` with 10 rows and `Customers` with 5 rows, how many total rows are produced by the SQL statement `SELECT * FROM Orders CROSS JOIN Customers;`?',
    options: [
      '50 rows',
      '15 rows',
      '10 rows',
      '5 rows'
    ],
    correct: 0,
    explain: 'A `CROSS JOIN` computes the Cartesian product: 10 rows × 5 rows = 50 rows.'
  },
  {
    id: 'tcat-cs-89',
    subject: 'Computer Science',
    topic: 'Database Basics',
    difficulty: 'Hard',
    q: 'What is the fundamental difference between a Candidate Key and a Super Key?',
    options: [
      'A Candidate Key is a minimal Super Key containing no redundant attributes',
      'A Super Key contains no redundant attributes, while a Candidate Key can contain extra fields',
      'A Candidate Key cannot uniquely identify a row, while a Super Key can',
      'A table can possess only one Super Key but multiple Candidate Keys'
    ],
    correct: 0,
    explain: 'A super key is any set of attributes that uniquely identifies a row; a candidate key is a minimal super key with no extraneous attributes.'
  },
  {
    id: 'tcat-cs-90',
    subject: 'Computer Science',
    topic: 'Database Basics',
    difficulty: 'Hard',
    q: 'In SQL transaction management, what is the consequence of executing a `ROLLBACK` statement?',
    options: [
      'It reverts all data modifications made within the current uncommitted transaction, restoring the database to its prior state',
      'It writes all pending changes permanently to non-volatile disk storage',
      'It closes the database connection and terminates all active user sessions',
      'It removes foreign key constraints temporarily until re-enabled'
    ],
    correct: 0,
    explain: '`ROLLBACK` undoes all modifications performed during the current transaction since the last `COMMIT` or savepoint.'
  }
];

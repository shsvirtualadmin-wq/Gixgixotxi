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
  },
  {
    id: "tcat-cs-91",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Easy",
    q: "In the classic Von Neumann architecture, which bus is unidirectional under normal memory read operations?",
    options: [
          "Data Bus",
          "Address Bus",
          "Control Bus",
          "System Clock Bus"
    ],
    correct: 1,
    explain: "The Address Bus is unidirectional; the CPU sends memory addresses out to system memory or I/O controllers to select specific storage locations."
  },
  {
    id: "tcat-cs-92",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Easy",
    q: "Which register holds the memory address of the next instruction waiting to be fetched and executed?",
    options: [
          "Instruction Register (IR)",
          "Program Counter (PC)",
          "Memory Buffer Register (MBR)",
          "Accumulator (ACC)"
    ],
    correct: 1,
    explain: "The Program Counter (PC) automatically increments or branches to hold the address of the next sequential instruction."
  },
  {
    id: "tcat-cs-93",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Easy",
    q: "What is the primary role of the BIOS / UEFI firmware stored in non-volatile ROM/Flash during system boot?",
    options: [
          "Compiling kernel source code into machine instructions",
          "Executing the Power-On Self-Test (POST) and bootstrapping the OS loader",
          "Managing virtual memory page swapping on the SSD",
          "Allocating dynamic heap memory to background daemon processes"
    ],
    correct: 1,
    explain: "The firmware runs the Power-On Self-Test (POST), initializes essential motherboard hardware, and transfers execution control to the OS bootloader."
  },
  {
    id: "tcat-cs-94",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Easy",
    q: "Which optical or solid-state storage technology stores binary bits using trapped electron charges in floating-gate or charge-trap flash cells rather than magnetic domains?",
    options: [
          "Hard Disk Drive (HDD)",
          "Solid-State Drive (SSD)",
          "Magnetic Tape",
          "Floppy Disk"
    ],
    correct: 1,
    explain: "Solid-State Drives (SSDs) utilize NAND flash memory with floating-gate or charge-trap transistors to retain digital charges without moving parts."
  },
  {
    id: "tcat-cs-95",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "In a multi-level cache hierarchy, what is the typical relationship between L1, L2, and L3 caches in terms of access latency and storage capacity?",
    options: [
          "L1 has the lowest latency and smallest capacity; L3 has the highest latency and largest capacity",
          "L1 has the largest capacity and lowest latency; L3 has the smallest capacity and highest latency",
          "L3 has the lowest latency and smallest capacity; L1 has the highest latency and largest capacity",
          "All cache levels share identical capacity and access latency"
    ],
    correct: 0,
    explain: "L1 cache sits directly inside processor core execution pipelines (fastest, smallest, ~32-64 KB), whereas L3 is shared across cores (larger, slower, ~8-64 MB)."
  },
  {
    id: "tcat-cs-96",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "How does Direct Memory Access (DMA) optimize system I/O performance during large file transfers between disk controllers and main RAM?",
    options: [
          "It accelerates CPU arithmetic operations using vector registers",
          "It allows hardware devices to transfer data directly to/from RAM without CPU cycle intervention",
          "It replaces physical memory addresses with encrypted virtual page tables",
          "It compresses data packets before transmitting across the system bus"
    ],
    correct: 1,
    explain: "A DMA controller handles data transfers directly between I/O peripherals and RAM, freeing the CPU from executing per-byte load/store instructions."
  },
  {
    id: "tcat-cs-97",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Medium",
    q: "Under the IEEE 754 standard for single-precision 32-bit floating-point representation, what is the bit allocation for the Sign, Biased Exponent, and Mantissa (Fraction)?",
    options: [
          "Sign: 1 bit, Exponent: 8 bits, Mantissa: 23 bits",
          "Sign: 1 bit, Exponent: 11 bits, Mantissa: 20 bits",
          "Sign: 2 bits, Exponent: 6 bits, Mantissa: 24 bits",
          "Sign: 1 bit, Exponent: 7 bits, Mantissa: 24 bits"
    ],
    correct: 0,
    explain: "IEEE 754 32-bit float uses 1 bit for sign, 8 bits for excess-127 exponent, and 23 bits for the normalized significand (mantissa)."
  },
  {
    id: "tcat-cs-98",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Medium",
    q: "Which pipeline hazard occurs when an instruction depends on the result of a previous instruction that has not yet completed its write-back phase?",
    options: [
          "Structural hazard",
          "Data hazard (Read-After-Write)",
          "Control hazard (Branch penalty)",
          "Bus contention hazard"
    ],
    correct: 1,
    explain: "A Data hazard (RAW) occurs when instruction j tries to read a source register before prior instruction i has written its updated value."
  },
  {
    id: "tcat-cs-99",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Medium",
    q: "In virtual memory systems, what is the primary cause of \"thrashing\"?",
    options: [
          "The CPU overheating due to excessive clock overclocking",
          "The operating system spending more time swapping pages between RAM and disk than executing user processes",
          "A software deadlock between two concurrent database transactions",
          "An unhandled division-by-zero hardware exception"
    ],
    correct: 1,
    explain: "Thrashing occurs when active working sets exceed physical RAM, causing constant page faults and continuous disk paging activity."
  },
  {
    id: "tcat-cs-100",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "In RAID storage configurations, which level provides block-level striping with distributed parity across all member disks without requiring a dedicated parity drive?",
    options: [
          "RAID 0",
          "RAID 1",
          "RAID 4",
          "RAID 5"
    ],
    correct: 3,
    explain: "RAID 5 stripes both data and parity blocks across all drives (distributed parity), eliminating the write bottleneck of a dedicated parity disk (which characterizes RAID 4)."
  },
  {
    id: "tcat-cs-101",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "What is the function of the Translation Lookaside Buffer (TLB) in modern hardware memory management units (MMU)?",
    options: [
          "To store dirty cache lines before writing back to main DRAM",
          "To cache recent virtual-to-physical page address translations, bypassing page table walks in RAM",
          "To execute arithmetic instructions directly inside the memory controller",
          "To verify the cryptographic digital signature of bootloader binaries"
    ],
    correct: 1,
    explain: "The TLB is an associative hardware cache that stores recent virtual-to-physical page mappings, avoiding the latency of multi-level page table lookups in RAM."
  },
  {
    id: "tcat-cs-102",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "Which interrupt type is non-maskable (NMI) and dispatched directly to the CPU to handle catastrophic hardware malfunctions such as parity errors or bus timeouts?",
    options: [
          "Software interrupt generated by an `int 0x80` syscall instruction",
          "Hardware interrupt generated by a keyboard keystroke",
          "Non-Maskable Interrupt (NMI) line signaling critical memory or bus faults",
          "Timer interrupt generated by the 8254 Programmable Interval Timer"
    ],
    correct: 2,
    explain: "An NMI cannot be ignored or masked by the processor interrupt flag (IF) and is reserved for critical, unrecoverable hardware events."
  },
  {
    id: "tcat-cs-103",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "In modern superscalar processors, what is the primary benefit of Out-of-Order (OoO) execution and Register Renaming?",
    options: [
          "Eliminating false data dependencies (Write-After-Read and Write-After-Write hazards)",
          "Doubling the physical size of the L1 data cache lines",
          "Guaranteeing deterministic execution time for real-time aerospace firmware",
          "Eliminating the need for a hardware floating-point unit"
    ],
    correct: 0,
    explain: "Register renaming maps architectural registers to a larger pool of physical registers, resolving WAR (anti-dependence) and WAW (output-dependence) hazards to allow instructions to execute out of order."
  },
  {
    id: "tcat-cs-104",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "In C/C++, what is the size (in bytes) of a `char` data type as mandated by the ANSI/ISO C standard?",
    options: [
          "1 byte",
          "2 bytes",
          "4 bytes",
          "Implementation-dependent (8 to 32 bits)"
    ],
    correct: 0,
    explain: "By definition in the ISO C standard, `sizeof(char)` is always exactly 1 byte."
  },
  {
    id: "tcat-cs-105",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "What is the output of the following C expression: `15 % 4`?",
    options: [
          "3.75",
          "3",
          "2",
          "0"
    ],
    correct: 1,
    explain: "The modulus operator `%` computes the integer remainder of division: 15 / 4 = 3 with remainder 3."
  },
  {
    id: "tcat-cs-106",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "In structured programming, which condition is mandatory to prevent a recursive function from executing infinitely until a stack overflow occurs?",
    options: [
          "A global static counter variable",
          "A base case terminating condition",
          "An explicit heap memory allocation",
          "A goto jumping statement"
    ],
    correct: 1,
    explain: "Every valid recursive function must define a base case that returns without making further recursive calls."
  },
  {
    id: "tcat-cs-107",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "Which logical operator exhibits short-circuit evaluation such that the second operand is never evaluated if the first operand evaluates to `false`?",
    options: [
          "Logical OR (`||`)",
          "Logical AND (`&&`)",
          "Bitwise AND (`&`)",
          "Bitwise XOR (`^`)"
    ],
    correct: 1,
    explain: "In C and C++, `&&` stops evaluation immediately if the left-hand operand is false, since false AND anything is guaranteed to be false."
  },
  {
    id: "tcat-cs-108",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "What does the `break` statement do when executed inside a nested `for` loop in C/C++?",
    options: [
          "Terminates all outer loops immediately",
          "Terminates the innermost enclosing loop and resumes execution at the next outer statement",
          "Skips the current iteration and begins the next loop increment",
          "Halts the entire program execution"
    ],
    correct: 1,
    explain: "A `break` statement exits only the innermost loop or `switch` block in which it appears."
  },
  {
    id: "tcat-cs-109",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Medium",
    q: "What is the value of `x` after executing: `int a = 5; int x = ++a * 2;`?",
    options: [
          "10",
          "12",
          "11",
          "14"
    ],
    correct: 1,
    explain: "The pre-increment `++a` increments `a` from 5 to 6 first; then 6 * 2 yields 12."
  },
  {
    id: "tcat-cs-110",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Medium",
    q: "What is the difference between `malloc()` and `calloc()` functions in standard C memory management?",
    options: [
          "`malloc()` allocates stack memory, whereas `calloc()` allocates heap memory",
          "`malloc()` does not initialize memory (contents are indeterminate), while `calloc()` clears allocated memory to all-bits-zero",
          "`calloc()` cannot allocate memory for arrays",
          "`malloc()` requires the number of elements and element size separately, whereas `calloc()` accepts only total bytes"
    ],
    correct: 1,
    explain: "`malloc(bytes)` leaves allocated bytes uninitialized; `calloc(n, size)` zeroes out every byte of allocated storage."
  },
  {
    id: "tcat-cs-111",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Medium",
    q: "Given `int arr[] = {10, 20, 30, 40}; int *ptr = arr;`, what does `*(ptr + 2)` evaluate to?",
    options: [
          "10",
          "20",
          "30",
          "40"
    ],
    correct: 2,
    explain: "`ptr` points to `arr[0]` (10). Pointer arithmetic `ptr + 2` offsets by 2 integer elements, pointing to `arr[2]`, which dereferences to 30."
  },
  {
    id: "tcat-cs-112",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Medium",
    q: "What is the purpose of header guards (`#ifndef HEADER_H ... #endif`) in C/C++ header files?",
    options: [
          "To prevent the header file from being compiled by the C++ linker",
          "To prevent duplicate definitions and compilation errors resulting from multiple inclusion of the same header",
          "To encrypt proprietary source code against unauthorized viewing",
          "To force the preprocessor to load functions into dynamic shared libraries"
    ],
    correct: 1,
    explain: "Header guards ensure that the declarations in a header file are parsed only once per translation unit, preventing redefinition errors."
  },
  {
    id: "tcat-cs-113",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Medium",
    q: "In C++, what happens when a function declares a parameter as `const int &val`?",
    options: [
          "A copy of the argument is made and its value cannot be modified",
          "The parameter is passed by reference, avoiding copy overhead, and the function cannot modify the caller's original variable",
          "The argument must be an integer pointer allocated on the heap",
          "The function returns a constant reference to a local variable"
    ],
    correct: 1,
    explain: "Passing by `const &` combines the efficiency of pass-by-reference (no object copying) with the safety of immutability."
  },
  {
    id: "tcat-cs-114",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Hard",
    q: "What does the `static` keyword indicate when applied to a global variable defined outside of any function in a C file?",
    options: [
          "The variable is placed in read-only code memory and cannot be modified",
          "The variable has internal linkage and is visible only within that specific translation unit (`.c` file)",
          "The variable is re-allocated every time a function is invoked",
          "The variable can be accessed across multiple translation units via `extern` declarations"
    ],
    correct: 1,
    explain: "A file-scope `static` variable has internal linkage, restricting its visibility to that specific source file and preventing symbol collisions."
  },
  {
    id: "tcat-cs-115",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Hard",
    q: "Consider the declaration: `int (*fp)(char, float);`. What does `fp` represent?",
    options: [
          "A function returning a pointer to an array of integers",
          "A pointer to a function that takes `(char, float)` arguments and returns an `int`",
          "A macro expanding to a cast expression between char and float",
          "An array of function pointers with integer indices"
    ],
    correct: 1,
    explain: "`(*fp)(char, float)` declares a function pointer `fp` whose target function accepts a `char` and a `float` and yields an `int`."
  },
  {
    id: "tcat-cs-116",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Hard",
    q: "Why does structure padding occur in C/C++ structs (e.g., `struct { char c; int x; };` having size 8 instead of 5 on 32/64-bit architectures)?",
    options: [
          "To allow the compiler to store variable names inside the binary",
          "To align data members on natural word boundaries matching hardware bus memory alignment requirements",
          "To prevent stack buffer overflow attacks during function calls",
          "To satisfy ASCII character encoding standards"
    ],
    correct: 1,
    explain: "CPUs access multi-byte data most efficiently when aligned to addresses that are multiples of the data size; compilers insert padding bytes to satisfy alignment."
  },
  {
    id: "tcat-cs-117",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Hard",
    q: "What is the asymptotic time complexity of evaluating the n-th Fibonacci number using a naive recursive implementation `fib(n) = fib(n-1) + fib(n-2)` without memoization?",
    options: [
          "O(n)",
          "O(n log n)",
          "O(2^n)",
          "O(1)"
    ],
    correct: 2,
    explain: "Naive recursive Fibonacci creates a binary tree of redundant subproblem calls, resulting in exponential time complexity O(2^n)."
  },
  {
    id: "tcat-cs-118",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Easy",
    q: "Which data structure operates strictly on a Last-In, First-Out (LIFO) access discipline?",
    options: [
          "Queue",
          "Stack",
          "Linked List",
          "Binary Search Tree"
    ],
    correct: 1,
    explain: "A Stack follows the LIFO principle: the element added most recently is the first to be removed."
  },
  {
    id: "tcat-cs-119",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Easy",
    q: "What is the worst-case time complexity of accessing an arbitrary element by index in a contiguous array of size n?",
    options: [
          "O(1)",
          "O(n)",
          "O(log n)",
          "O(n^2)"
    ],
    correct: 0,
    explain: "Array indexing uses direct address calculation `Base + (Index * ElementSize)`, executing in constant time O(1)."
  },
  {
    id: "tcat-cs-120",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Easy",
    q: "In a singly linked list, what does the `next` pointer of the last (tail) node store to indicate the end of the list?",
    options: [
          "The address of the head node",
          "A NULL pointer (or 0 / nullptr)",
          "A pointer to itself",
          "The total count of nodes"
    ],
    correct: 1,
    explain: "The terminal node in a standard linear linked list points to NULL (nullptr), signaling that no successor nodes exist."
  },
  {
    id: "tcat-cs-121",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Easy",
    q: "Which linear data structure is standardly utilized for implementing Breadth-First Search (BFS) graph traversal?",
    options: [
          "Stack",
          "Queue",
          "Binary Max-Heap",
          "Hash Set"
    ],
    correct: 1,
    explain: "BFS traverses graph vertices level by level, requiring a FIFO Queue to process vertices in the order they are discovered."
  },
  {
    id: "tcat-cs-122",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "In a circular array queue of capacity N with index pointers `front` and `rear`, what is the formula to advance `rear` when enqueuing a new element?",
    options: [
          "`rear = rear + 1`",
          "`rear = (rear + 1) % N`",
          "`rear = (rear - 1) % N`",
          "`rear = (front + rear) / 2`"
    ],
    correct: 1,
    explain: "Modulo arithmetic `(rear + 1) % N` wraps the pointer back to index 0 when the boundary of the allocated array is reached."
  },
  {
    id: "tcat-cs-123",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "What is the in-order traversal of a Binary Search Tree (BST) guaranteed to produce?",
    options: [
          "Nodes sorted in non-decreasing (ascending) order",
          "Nodes sorted in strictly descending order",
          "Nodes grouped strictly by their tree depth",
          "Leaves followed by internal parent nodes"
    ],
    correct: 0,
    explain: "In-order traversal visits `Left Subtree -> Root -> Right Subtree`. In a BST, this produces keys in sorted ascending order."
  },
  {
    id: "tcat-cs-124",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "What is the worst-case search time complexity in an unbalanced Binary Search Tree containing n keys?",
    options: [
          "O(log n)",
          "O(1)",
          "O(n)",
          "O(n log n)"
    ],
    correct: 2,
    explain: "When keys are inserted in sorted order, an unbalancing BST degenerates into a linear linked list with O(n) height and search time."
  },
  {
    id: "tcat-cs-125",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "Which data structure can convert an infix arithmetic expression `(A + B) * C` into postfix notation `A B + C *`?",
    options: [
          "Stack",
          "Double-ended Queue",
          "Min-Heap",
          "Adjacency Matrix"
    ],
    correct: 0,
    explain: "Dijkstra's Shunting-yard algorithm utilizes an operator Stack to manage operator precedence and parentheses when converting to postfix (RPN)."
  },
  {
    id: "tcat-cs-126",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "In a complete binary max-heap stored in an array where the root is at index 0, what are the indices of the left child and right child of node `i`?",
    options: [
          "Left: `2i + 1`, Right: `2i + 2`",
          "Left: `2i`, Right: `2i + 1`",
          "Left: `i / 2`, Right: `i / 2 + 1`",
          "Left: `i + 1`, Right: `i + 2`"
    ],
    correct: 0,
    explain: "For zero-based heap indexing, the left child of node `i` is at index `2i + 1` and the right child is at index `2i + 2`."
  },
  {
    id: "tcat-cs-127",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Hard",
    q: "In an AVL tree, what is the permissible range for the balance factor (height of left subtree minus height of right subtree) of any node?",
    options: [
          "0 only",
          "-1, 0, or +1",
          "-2, -1, 0, +1, or +2",
          "Any positive integer"
    ],
    correct: 1,
    explain: "By definition, an AVL tree requires every node to maintain a balance factor of -1, 0, or +1. If it reaches ±2, a rotation is triggered."
  },
  {
    id: "tcat-cs-128",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Hard",
    q: "What is the amortized time complexity of inserting n elements into a dynamic array (vector) that doubles its capacity whenever it becomes full?",
    options: [
          "O(1) per insertion",
          "O(log n) per insertion",
          "O(n) per insertion",
          "O(n^2) total"
    ],
    correct: 0,
    explain: "Although individual resizing operations require O(n) element copies, they occur infrequently; the aggregate cost divided over n insertions yields O(1) amortized time."
  },
  {
    id: "tcat-cs-129",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Hard",
    q: "How does separate chaining resolve hash collisions in a hash table?",
    options: [
          "By probing the next sequential slot in the array until an empty bucket is found",
          "By maintaining a linked list (or tree) of colliding key-value pairs at each bucket index",
          "By computing a second hash function `h2(key)` as an offset",
          "By doubling the hash table size on every collision"
    ],
    correct: 1,
    explain: "In separate chaining, each table bucket points to a linked list (or balanced tree) holding all records whose keys hashed to that identical index."
  },
  {
    id: "tcat-cs-130",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Hard",
    q: "For a sparse graph with V vertices and E edges where E is much smaller than V^2, which representation is more space-efficient?",
    options: [
          "Adjacency Matrix (space complexity O(V^2))",
          "Adjacency List (space complexity O(V + E))",
          "Edge Weight Truth Table (space complexity O(2^V))",
          "Both require identical memory space"
    ],
    correct: 1,
    explain: "An adjacency list allocates storage only for vertices and existing edges O(V + E), saving significant space over an O(V^2) matrix when E << V^2."
  },
  {
    id: "tcat-cs-131",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Easy",
    q: "According to De Morgan's First Law, what is the equivalent of `(A · B)'` (the complement of A AND B)?",
    options: [
          "A' · B'",
          "A' + B'",
          "A + B",
          "(A + B)'"
    ],
    correct: 1,
    explain: "De Morgan's law states: `(A · B)' = A' + B'` (the complement of a product is the sum of complements)."
  },
  {
    id: "tcat-cs-132",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Easy",
    q: "Which pair of logic gates are known as \"universal gates\" because any combinational logic circuit can be constructed using only that gate type?",
    options: [
          "AND and OR",
          "NAND and NOR",
          "XOR and XNOR",
          "NOT and AND"
    ],
    correct: 1,
    explain: "NAND and NOR gates are universal gates; complete sets of NOT, AND, and OR functions can be synthesized using either gate alone."
  },
  {
    id: "tcat-cs-133",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Easy",
    q: "What is the output of a two-input XOR gate when both inputs are binary 1?",
    options: [
          "1",
          "0",
          "High Impedance (Z)",
          "Undefined"
    ],
    correct: 1,
    explain: "An XOR gate outputs 1 if and only if the inputs differ. When both inputs are 1, the output is 0."
  },
  {
    id: "tcat-cs-134",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Easy",
    q: "In Boolean algebra, what is the simplified value of `A + A' · B`?",
    options: [
          "A",
          "B",
          "A + B",
          "A · B"
    ],
    correct: 2,
    explain: "By distributive law: `A + A'B = (A + A')(A + B) = (1)(A + B) = A + B`."
  },
  {
    id: "tcat-cs-135",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Medium",
    q: "What are the Boolean expressions for the Sum (S) and Carry (C) outputs of a Half Adder with inputs A and B?",
    options: [
          "S = A ⊕ B, C = A · B",
          "S = A · B, C = A + B",
          "S = A + B, C = A ⊕ B",
          "S = (A · B)', C = A ⊕ B"
    ],
    correct: 0,
    explain: "A half adder computes `Sum = A ⊕ B` and `Carry = A · B`."
  },
  {
    id: "tcat-cs-136",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Medium",
    q: "How many select input lines are required for an 8-to-1 multiplexer (MUX)?",
    options: [
          "2",
          "3",
          "4",
          "8"
    ],
    correct: 1,
    explain: "An 8-to-1 MUX selects 1 of 2^n inputs using n select lines. Since 2^3 = 8, exactly 3 select lines are required."
  },
  {
    id: "tcat-cs-137",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Medium",
    q: "What is the binary Gray code equivalent of the binary number `1010`?",
    options: [
          "1111",
          "1100",
          "1110",
          "1001"
    ],
    correct: 0,
    explain: "Binary to Gray code: MSB remains 1. Next bit: 1 ⊕ 0 = 1. Next: 0 ⊕ 1 = 1. Next: 1 ⊕ 0 = 1. The result is 1111."
  },
  {
    id: "tcat-cs-138",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Medium",
    q: "In Karnaugh mapping (K-map), why are adjacent cells ordered using Gray code sequence (00, 01, 11, 10)?",
    options: [
          "To maximize the visual symmetry of minterm groupings",
          "To ensure that adjacent cells differ by exactly one binary variable (single bit change)",
          "To simplify arithmetic addition in the accumulator",
          "To prevent race conditions on printed circuit traces"
    ],
    correct: 1,
    explain: "Gray code ordering ensures that moving between any two adjacent horizontal or vertical cells changes only one variable state, enabling algebraic simplification."
  },
  {
    id: "tcat-cs-139",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Medium",
    q: "What is the function of a 3-to-8 line decoder with active-low outputs when the input code is binary `011`?",
    options: [
          "Output line 3 is set to LOW (0), while all other output lines remain HIGH (1)",
          "Output line 3 is set to HIGH (1), while all other output lines remain LOW (0)",
          "All 8 output lines are asserted to LOW simultaneously",
          "Lines 0, 1, and 1 are inverted"
    ],
    correct: 0,
    explain: "Binary 011 represents decimal 3. In an active-low decoder, only the selected line (line 3) goes LOW (0), with all unselected lines staying HIGH (1)."
  },
  {
    id: "tcat-cs-140",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Hard",
    q: "In an SR latch constructed using two cross-coupled NOR gates, which input combination is considered invalid/forbidden because it produces an unstable race condition?",
    options: [
          "S = 0, R = 0",
          "S = 0, R = 1",
          "S = 1, R = 0",
          "S = 1, R = 1"
    ],
    correct: 3,
    explain: "For a NOR-based SR latch, setting S = 1 and R = 1 forces both Q and Q' outputs to 0 simultaneously, violating the complement rule and creating an unpredictable race condition upon return to 0,0."
  },
  {
    id: "tcat-cs-141",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Hard",
    q: "What problem occurs in a basic level-triggered JK flip-flop when both J = 1, K = 1, and the clock pulse duration is longer than the propagation delay of the gates?",
    options: [
          "The flip-flop permanently latches into high impedance",
          "Race-around condition (continuous toggling during the clock pulse)",
          "The clock signal gets short-circuited to ground",
          "The output becomes locked to the J input voltage"
    ],
    correct: 1,
    explain: "The race-around condition occurs when J=1, K=1 and clock pulse width tp > gate delay Δt, causing the output to toggle repeatedly while the clock is high."
  },
  {
    id: "tcat-cs-142",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Hard",
    q: "How does a Master-Slave JK flip-flop eliminate the race-around condition?",
    options: [
          "By using CMOS field-effect transistors instead of TTL bipolars",
          "By isolating the master stage (active on clock HIGH) and slave stage (active on clock LOW), preventing continuous feedback within a single cycle",
          "By setting both inputs J and K to zero during clock transitions",
          "By replacing the clock signal with a DC bias"
    ],
    correct: 1,
    explain: "The Master-Slave structure clocks the master on the leading edge and the slave on the trailing edge (via an inverter), breaking the direct feedback loop."
  },
  {
    id: "tcat-cs-143",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Hard",
    q: "A T (Toggle) flip-flop with input T = 1 is connected to a 100 MHz clock signal. What is the frequency of the output signal Q?",
    options: [
          "100 MHz",
          "50 MHz",
          "200 MHz",
          "25 MHz"
    ],
    correct: 1,
    explain: "A T flip-flop with T=1 changes state on every active clock edge, requiring two clock pulses to complete one full output cycle; thus it acts as a frequency divider by 2 (100 MHz / 2 = 50 MHz)."
  },
  {
    id: "tcat-cs-144",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Easy",
    q: "In the ISO-OSI reference model, which layer is responsible for end-to-end process-to-process communication, port addressing, and reliable data delivery?",
    options: [
          "Network Layer",
          "Transport Layer",
          "Data Link Layer",
          "Session Layer"
    ],
    correct: 1,
    explain: "The Transport Layer (Layer 4) handles end-to-end communication, port addressing (e.g., TCP/UDP ports), flow control, and error recovery."
  },
  {
    id: "tcat-cs-145",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Easy",
    q: "What is the standard size of a physical MAC (Media Access Control) address in Ethernet networking?",
    options: [
          "32 bits (4 bytes)",
          "48 bits (6 bytes)",
          "64 bits (8 bytes)",
          "128 bits (16 bytes)"
    ],
    correct: 1,
    explain: "An Ethernet MAC address is 48 bits (6 bytes) long, commonly written in hexadecimal notation (e.g., 00:1A:2B:3C:4D:5E)."
  },
  {
    id: "tcat-cs-146",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Easy",
    q: "Which standard Internet protocol maps a known IP address to a physical MAC address on a local area network?",
    options: [
          "ARP (Address Resolution Protocol)",
          "DHCP (Dynamic Host Configuration Protocol)",
          "DNS (Domain Name System)",
          "ICMP (Internet Control Message Protocol)"
    ],
    correct: 0,
    explain: "ARP broadcasts on the local subnet to resolve an IP address to the target device's physical MAC address."
  },
  {
    id: "tcat-cs-147",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Easy",
    q: "What protocol operates at port 53 by default to translate human-readable domain names (like www.google.com) into numerical IP addresses?",
    options: [
          "HTTP",
          "FTP",
          "DNS",
          "SMTP"
    ],
    correct: 2,
    explain: "DNS (Domain Name System) translates alphanumeric domain names into IP addresses, communicating primarily via UDP port 53."
  },
  {
    id: "tcat-cs-148",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Easy",
    q: "Which network topology connects every computer to a central hub, switch, or router via individual dedicated cables?",
    options: [
          "Bus Topology",
          "Ring Topology",
          "Star Topology",
          "Mesh Topology"
    ],
    correct: 2,
    explain: "In a Star topology, all terminal nodes radiate from a central networking device (switch or hub)."
  },
  {
    id: "tcat-cs-149",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Medium",
    q: "How many usable host IP addresses are available in an IPv4 subnet with CIDR prefix `/27`?",
    options: [
          "32",
          "30",
          "62",
          "28"
    ],
    correct: 1,
    explain: "A `/27` subnet leaves 32 - 27 = 5 host bits. Total addresses = 2^5 = 32. Subtracting the network address and broadcast address yields 32 - 2 = 30 usable host addresses."
  },
  {
    id: "tcat-cs-150",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Medium",
    q: "What is the correct three-step sequence of control packets exchanged during a TCP connection handshake?",
    options: [
          "ACK -> SYN -> SYN-ACK",
          "SYN -> SYN-ACK -> ACK",
          "FIN -> ACK -> FIN-ACK",
          "SYN -> ACK -> DATA"
    ],
    correct: 1,
    explain: "TCP initiates connection through a three-way handshake: Client sends SYN, Server responds with SYN-ACK, and Client completes with ACK."
  },
  {
    id: "tcat-cs-151",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Medium",
    q: "Which RFC 1918 private IPv4 address range is designated for Class C private local area networks?",
    options: [
          "10.0.0.0 to 10.255.255.255",
          "172.16.0.0 to 172.31.255.255",
          "192.168.0.0 to 192.168.255.255",
          "169.254.0.0 to 169.254.255.255"
    ],
    correct: 2,
    explain: "`192.168.0.0/16` is the RFC 1918 designated Class C private address space."
  },
  {
    id: "tcat-cs-152",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Medium",
    q: "How does UDP differ fundamentally from TCP in terms of delivery guarantees and overhead?",
    options: [
          "UDP is connection-oriented and provides packet retransmission, whereas TCP is connectionless",
          "UDP is connectionless and provides low-overhead, best-effort delivery without packet reordering or retransmissions",
          "UDP encrypts all payloads using RSA by default",
          "UDP operates exclusively over fiber-optic physical media"
    ],
    correct: 1,
    explain: "UDP eliminates connection handshake, sequencing, and acknowledgement overhead, providing fast, best-effort transport ideal for real-time video/gaming."
  },
  {
    id: "tcat-cs-153",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Hard",
    q: "In the CSMA/CD access control protocol used in legacy half-duplex Ethernet, how do stations handle a transmission collision?",
    options: [
          "Both stations continue sending frames at higher transmission power",
          "Both stations immediately abort transmission, emit a jam signal, and execute binary exponential backoff before retransmitting",
          "The central hub discards the packet and terminates the offending node's connection",
          "The receiving station requests an immediate retransmission via ICMP"
    ],
    correct: 1,
    explain: "Upon detecting a collision, stations send a 32-bit jam signal, abort transmission, and wait a random backoff duration calculated using binary exponential backoff."
  },
  {
    id: "tcat-cs-154",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Hard",
    q: "Which routing algorithm does Open Shortest Path First (OSPF) implement to calculate shortest path trees to all destinations?",
    options: [
          "Bellman-Ford distance-vector algorithm",
          "Dijkstra's link-state algorithm",
          "Floyd-Warshall all-pairs algorithm",
          "Ford-Fulkerson maximum flow algorithm"
    ],
    correct: 1,
    explain: "OSPF is an interior gateway link-state protocol that runs Dijkstra's shortest-path algorithm over its synchronized topological link-state database."
  },
  {
    id: "tcat-cs-155",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Hard",
    q: "How does asymmetric (public-key) cryptography establish secure symmetric session keys during a TLS / HTTPS handshake?",
    options: [
          "The client encrypts a randomly generated symmetric pre-master secret using the server's certified public key",
          "The server publishes its private key to all clients over an unencrypted UDP broadcast",
          "Both parties compute identical keys using plain MD5 checksum hashing",
          "The ISP router injects a hardcoded hardware key into the TCP header"
    ],
    correct: 0,
    explain: "The client verifies the server's public key certificate and uses it (or Diffie-Hellman ephemeral exchange) to securely agree on a symmetric session key for bulk data encryption."
  },
  {
    id: "tcat-cs-156",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Hard",
    q: "What is the function of the \"Time to Live\" (TTL) field in the IPv4 packet header?",
    options: [
          "To record the total round-trip latency in milliseconds",
          "To prevent packets from circulating indefinitely in routing loops by decrementing at each router hop until discarded at 0",
          "To schedule the exact time of day when the packet should be delivered to the socket",
          "To count the number of data retransmissions attempted by TCP"
    ],
    correct: 1,
    explain: "Each router decrements the TTL field by at least 1. If TTL reaches zero, the router discards the packet and sends an ICMP \"Time Exceeded\" message back to the source."
  },
  {
    id: "tcat-cs-157",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Easy",
    q: "In the relational database model, what is a \"tuple\" equivalent to?",
    options: [
          "A database table (relation)",
          "A single record (row)",
          "An attribute column",
          "A primary key constraint"
    ],
    correct: 1,
    explain: "In relational database formal terminology, a tuple corresponds to a single row or record in a relation (table)."
  },
  {
    id: "tcat-cs-158",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Easy",
    q: "Which relational database key uniquely identifies each record in a table and cannot contain NULL values?",
    options: [
          "Foreign Key",
          "Primary Key",
          "Secondary Index Key",
          "Composite Foreign Key"
    ],
    correct: 1,
    explain: "A Primary Key enforces entity integrity: every table row must have a unique, non-null value for this key."
  },
  {
    id: "tcat-cs-159",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Easy",
    q: "Which SQL command is used to retrieve specific columns of data matching criteria from a database table?",
    options: [
          "INSERT",
          "SELECT",
          "UPDATE",
          "DELETE"
    ],
    correct: 1,
    explain: "`SELECT` is the Data Query Language (DQL) command used to query and fetch records from tables."
  },
  {
    id: "tcat-cs-160",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Easy",
    q: "What type of entity relationship exists between Students and Courses in a university where a student enrolls in multiple courses and each course contains multiple students?",
    options: [
          "One-to-One (1:1)",
          "One-to-Many (1:N)",
          "Many-to-Many (M:N)",
          "Unary Recursive"
    ],
    correct: 2,
    explain: "Students and Courses form a Many-to-Many (M:N) relationship, implemented via a junction (associative) table containing foreign keys to both."
  },
  {
    id: "tcat-cs-161",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Easy",
    q: "Which SQL clause is used to filter individual rows before any grouping or aggregation takes place?",
    options: [
          "HAVING",
          "WHERE",
          "ORDER BY",
          "GROUP BY"
    ],
    correct: 1,
    explain: "`WHERE` filters individual records before grouping; `HAVING` filters grouped summary records after aggregation."
  },
  {
    id: "tcat-cs-162",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Medium",
    q: "What is the requirement for a database relation to satisfy First Normal Form (1NF)?",
    options: [
          "It must contain no partial functional dependencies on a composite primary key",
          "All column attributes must contain only atomic (indivisible) values, with no repeating groups",
          "It must eliminate all transitive dependencies on non-key attributes",
          "Every determinant must be a candidate key"
    ],
    correct: 1,
    explain: "1NF requires all attributes to hold atomic values (single values, no arrays or comma-separated lists) and unique column names."
  },
  {
    id: "tcat-cs-163",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Medium",
    q: "A relation is in 1NF. What additional condition must it satisfy to be in Second Normal Form (2NF)?",
    options: [
          "It must have no multi-valued dependencies",
          "It must have no partial functional dependency; all non-prime attributes must be fully functionally dependent on the entire primary key",
          "It must contain zero NULL values across all columns",
          "It must be stored on distributed database partitions"
    ],
    correct: 1,
    explain: "2NF requires 1NF plus the absence of partial dependencies (no non-key attribute can depend on only part of a composite primary key)."
  },
  {
    id: "tcat-cs-164",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Medium",
    q: "What condition constitutes a violation of Third Normal Form (3NF)?",
    options: [
          "A primary key consisting of more than one column",
          "A transitive functional dependency where a non-prime attribute depends on another non-prime attribute (`X -> Y -> Z`)",
          "Having an auto-incrementing integer identifier",
          "A foreign key referencing a table in the same database schema"
    ],
    correct: 1,
    explain: "3NF requires 2NF plus the removal of transitive dependencies, meaning non-key attributes must depend solely on candidate keys."
  },
  {
    id: "tcat-cs-165",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Medium",
    q: "What is the effect of an `INNER JOIN` between Table A and Table B on a specified join key?",
    options: [
          "It returns all rows from Table A, matching or non-matching",
          "It returns only the rows where there is an exact match on the join predicate in both tables",
          "It returns all rows from both tables, filling missing fields with NULL",
          "It deletes duplicate records from both tables"
    ],
    correct: 1,
    explain: "An `INNER JOIN` selects only records that have matching values in both tables based on the join condition."
  },
  {
    id: "tcat-cs-166",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Medium",
    q: "In the relational database ACID properties, what does the \"A\" (Atomicity) guarantee?",
    options: [
          "Data is encrypted at the atomic particle level",
          "All operations within a transaction succeed completely, or the entire transaction is rolled back with no partial effects",
          "Transactions execute concurrently without any shared locks",
          "Committed data persists permanently even through system power failure"
    ],
    correct: 1,
    explain: "Atomicity ensures \"all or nothing\" execution: if any part of a database transaction fails, all changes are aborted and rolled back."
  },
  {
    id: "tcat-cs-167",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Hard",
    q: "In Boyce-Codd Normal Form (BCNF), what rule must hold for every non-trivial functional dependency `X -> Y`?",
    options: [
          "`X` must be a superkey",
          "`Y` must be a prime attribute",
          "`X` and `Y` must belong to the same composite key",
          "`X` must contain fewer attributes than `Y`"
    ],
    correct: 0,
    explain: "BCNF is a stricter version of 3NF: for every non-trivial functional dependency X -> Y, the determinant X must be a superkey."
  },
  {
    id: "tcat-cs-168",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Hard",
    q: "Which database indexing data structure is standardly used for disk-based relational storage engines because of its high fan-out, shallow tree depth, and sequential leaf node linking?",
    options: [
          "Binary Search Tree",
          "B+ Tree",
          "Skip List",
          "Red-Black Tree"
    ],
    correct: 1,
    explain: "B+ Trees store all actual data pointers in leaf nodes linked as a contiguous doubly linked list, with internal nodes storing only keys for navigation, minimizing disk I/O."
  },
  {
    id: "tcat-cs-169",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Hard",
    q: "In database transaction management, what concurrency anomaly is characterized as a \"Dirty Read\"?",
    options: [
          "A transaction reads data that has been modified by another concurrent uncommitted transaction that later rolls back",
          "A transaction rereads a row and discovers data values have been modified by a committed transaction",
          "A transaction re-executes a range query and discovers new rows inserted by another committed transaction",
          "Two transactions execute simultaneous writes resulting in deadlocks"
    ],
    correct: 0,
    explain: "A Dirty Read (Read Uncommitted anomaly) occurs when Transaction A reads modifications made by Transaction B before B commits; if B rolls back, A holds phantom, invalid data."
  },
  {
    id: "tcat-cs-170",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Hard",
    q: "What is the role of a Two-Phase Commit (2PC) protocol in distributed database architectures?",
    options: [
          "To guarantee serializability by acquiring locks in a growing phase and releasing them in a shrinking phase",
          "To coordinate all distributed node participants across a network to ensure atomic commit or rollback of a distributed transaction",
          "To compress write-ahead transaction logs across two replication nodes",
          "To partition database tables into horizontal shards"
    ],
    correct: 1,
    explain: "Two-Phase Commit (Prepare phase followed by Commit/Abort phase) ensures all distributed participant nodes reach a unanimous agreement to commit or abort a transaction atomically."
  },
  {
    id: "tcat-cs-171",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Easy",
    q: "Which register in the CPU architecture holds the memory address of the next instruction to be fetched and executed?",
    options: [
      "Program Counter (PC)",
      "Instruction Register (IR)",
      "Memory Buffer Register (MBR)",
      "Accumulator (AC)"
    ],
    correct: 0,
    explain: "The Program Counter (PC) automatically increments to point to the address of the next machine code instruction in sequential program execution."
  },
  {
    id: "tcat-cs-172",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Easy",
    q: "How many distinct binary values can be represented using an 8-bit byte?",
    options: [
      "256",
      "128",
      "512",
      "64"
    ],
    correct: 0,
    explain: "With n = 8 bits, the total number of distinct binary permutations is 2^8 = 256 (ranging from 00000000_2 to 11111111_2, or 0 to 255 in decimal)."
  },
  {
    id: "tcat-cs-173",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Easy",
    q: "Which type of primary storage requires periodic electronic refresh cycles to retain capacitive charge in its memory cells?",
    options: [
      "Dynamic RAM (DRAM)",
      "Static RAM (SRAM)",
      "Read-Only Memory (ROM)",
      "Flash EEPROM"
    ],
    correct: 0,
    explain: "DRAM stores each bit in a microscopic capacitor and transistor pair. Because capacitors leak charge rapidly, DRAM requires periodic electronic refresh cycles."
  },
  {
    id: "tcat-cs-174",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Easy",
    q: "What is the primary role of the Basic Input/Output System (BIOS) during a computer power-on sequence?",
    options: [
      "Execute the Power-On Self-Test (POST) and initialize system hardware before loading the OS bootloader",
      "Manage real-time thread scheduling for application software",
      "Allocate virtual memory addresses to running processes",
      "Perform defragmentation on solid-state secondary storage"
    ],
    correct: 0,
    explain: "The BIOS/UEFI firmware initializes motherboard chipsets, runs the Power-On Self-Test (POST) to verify hardware integrity, and locates the primary boot device."
  },
  {
    id: "tcat-cs-175",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Easy",
    q: "Convert the hexadecimal value 0x2F into its equivalent decimal integer representation:",
    options: [
      "47",
      "39",
      "52",
      "45"
    ],
    correct: 0,
    explain: "0x2F = (2 * 16^1) + (15 * 16^0) = 32 + 15 = 47."
  },
  {
    id: "tcat-cs-176",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Medium",
    q: "In Direct Memory Access (DMA) data transfer, which bus line is asserted by the peripheral controller to request bus mastership from the CPU?",
    options: [
      "Hold Request (HOLD / HRQ)",
      "Interrupt Request (INTR)",
      "Acknowledge Enable (AEN)",
      "Ready Line (READY)"
    ],
    correct: 0,
    explain: "The DMA controller asserts the HOLD (or HRQ) line to request bus mastership. The CPU finishes its current bus cycle and asserts HLDA (Hold Acknowledge)."
  },
  {
    id: "tcat-cs-177",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Medium",
    q: "In CPU cache design, what is the fundamental trade-off of a Fully Associative cache compared to a Direct-Mapped cache?",
    options: [
      "Lower conflict misses at the expense of higher hardware comparator complexity and tag search latency",
      "Higher capacity miss rate at the expense of simpler decoders",
      "Elimination of compulsory misses without needing tag memory",
      "Zero latency replacement policy requiring no hit detection logic"
    ],
    correct: 0,
    explain: "In a fully associative cache, any memory block can reside in any cache line, eliminating conflict misses. However, all tags must be searched in parallel with complex comparators."
  },
  {
    id: "tcat-cs-178",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Medium",
    q: "In the IEEE 754 single-precision 32-bit floating-point format, how are the bits allocated across sign, exponent, and mantissa?",
    options: [
      "1 sign bit, 8 exponent bits (with bias 127), 23 fraction/mantissa bits",
      "1 sign bit, 11 exponent bits, 20 fraction/mantissa bits",
      "2 sign bits, 7 exponent bits, 23 fraction/mantissa bits",
      "1 sign bit, 16 exponent bits, 15 fraction/mantissa bits"
    ],
    correct: 0,
    explain: "IEEE 754 32-bit single precision allocates: Bit 31 = Sign, Bits 30-23 = 8-bit Exponent (biased by +127), Bits 22-0 = 23-bit Fraction (Mantissa)."
  },
  {
    id: "tcat-cs-179",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Medium",
    q: "Which pipeline hazard occurs when an instruction depends on the result of a previous instruction that has not yet completed its write-back stage?",
    options: [
      "Data hazard (Read-After-Write / RAW)",
      "Structural hazard",
      "Branch / Control hazard",
      "Instruction cache fault"
    ],
    correct: 0,
    explain: "A Data hazard (specifically Read-After-Write) occurs when an instruction needs data produced by a preceding instruction that has not yet updated the destination register."
  },
  {
    id: "tcat-cs-180",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Medium",
    q: "In computer architecture, what distinguishes Harvard architecture from von Neumann architecture?",
    options: [
      "Harvard architecture maintains physically separated memory and buses for instructions and data",
      "Harvard architecture does not utilize an Arithmetic Logic Unit",
      "Von Neumann architecture uses separate storage for data and instructions",
      "Von Neumann architecture executes instructions strictly in parallel without clock pulses"
    ],
    correct: 0,
    explain: "Harvard architecture features separate physical signal paths and memory stores for code and data, preventing von Neumann bus bottlenecking during fetch/execute cycles."
  },
  {
    id: "tcat-cs-181",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "What is the minimum Hamming distance required between valid codewords in an error-correcting code to detect up to 2 errors and correct 1 single-bit error?",
    options: [
      "d_min = 3",
      "d_min = 2",
      "d_min = 4",
      "d_min = 5"
    ],
    correct: 0,
    explain: "To detect s errors and correct t errors, minimum Hamming distance d_min >= 2t + s + 1. For t = 1, s = 1: d_min >= 2(1) + 1 = 3 (detects 2 errors and corrects 1)."
  },
  {
    id: "tcat-cs-182",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "In virtual memory management, what is the specific role of the Translation Lookaside Buffer (TLB)?",
    options: [
      "An associative hardware cache that stores recent virtual-to-physical page frame address translations",
      "A disk partition dedicated to holding swapped-out process pages",
      "A CPU register holding the base address of the inverted page table",
      "A software queue that handles page faults synchronously"
    ],
    correct: 0,
    explain: "The TLB is a high-speed associative hardware cache in the Memory Management Unit (MMU) that caches recent virtual-to-physical page translations to avoid two-level memory lookups."
  },
  {
    id: "tcat-cs-183",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "In RAID storage arrays, how does RAID 5 achieve data redundancy across multiple hard drives?",
    options: [
      "Block-level striping with distributed parity across all array disks",
      "Mirroring of data blocks onto a dedicated twin disk without striping",
      "Byte-level striping with a single dedicated parity disk",
      "Sequential bit-level duplication with error-correcting Hamming codes"
    ],
    correct: 0,
    explain: "RAID 5 utilizes block-level striping and distributes parity information evenly across all participating disks (preventing a single parity disk write bottleneck)."
  },
  {
    id: "tcat-cs-184",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "In a pipelined CPU executing branch instructions, what is the function of a Branch Target Buffer (BTB)?",
    options: [
      "To cache predicted branch target addresses keyed by the Program Counter so instruction fetch can continue without pipeline bubbles",
      "To hold flushed instructions during a pipeline recovery cycle",
      "To decode conditional branch opcode bits in the execution stage",
      "To prevent hardware interrupts during interrupt service routines"
    ],
    correct: 0,
    explain: "The Branch Target Buffer (BTB) stores previously encountered branch target addresses, allowing the fetch unit to speculate the target address immediately in the fetch cycle."
  },
  {
    id: "tcat-cs-185",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "In C and C++, what is the result of applying the modulus operator to integers: `19 % 4`?",
    options: [
      "3",
      "4",
      "1",
      "2"
    ],
    correct: 0,
    explain: "The modulus operator `%` computes the remainder of integer division: 19 = (4 * 4) + 3, so 19 % 4 evaluates to 3."
  },
  {
    id: "tcat-cs-186",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "Which C/C++ loop construct guarantees that the loop body will execute at least once regardless of whether the condition is initially true or false?",
    options: [
      "do-while loop",
      "for loop",
      "while loop",
      "nested loop"
    ],
    correct: 0,
    explain: "A `do-while` loop is a post-test loop: the condition expression is evaluated at the bottom of the loop body after the first iteration has already completed."
  },
  {
    id: "tcat-cs-187",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "In C/C++, what does the unary address-of operator `&` return when placed before a variable name?",
    options: [
      "The hexadecimal memory address of the variable",
      "The dereferenced value of the variable",
      "The bitwise inverse of the variable",
      "The size in bytes of the variable"
    ],
    correct: 0,
    explain: "The `&` operator returns the memory address where the operand variable is stored in system memory."
  },
  {
    id: "tcat-cs-188",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "What is the default value of an uninitialized local variable defined inside a function in C if no storage class is specified?",
    options: [
      "Indeterminate garbage value",
      "0 (Zero)",
      "NULL",
      "-1"
    ],
    correct: 0,
    explain: "Automatic local variables declared within function scope are allocated on the stack and contain whatever arbitrary bit pattern was previously in that memory location (garbage value)."
  },
  {
    id: "tcat-cs-189",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "What will be the output of the bitwise operation `12 & 10` in decimal?",
    options: [
      "8",
      "14",
      "2",
      "6"
    ],
    correct: 0,
    explain: "12 in binary is 1100_2 and 10 is 1010_2. Bitwise AND: 1100 & 1010 = 1000_2 = 8 in decimal."
  },
  {
    id: "tcat-cs-190",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Medium",
    q: "Consider the C declaration `int *ptr = (int *)malloc(5 * sizeof(int));`. What happens if this memory is never released before the pointer goes out of scope?",
    options: [
      "A memory leak occurs because heap memory remains allocated without any reference",
      "The memory is automatically reclaimed by the OS stack cleaner",
      "A segmentation fault triggers immediately",
      "The allocated heap space converts into static data"
    ],
    correct: 0,
    explain: "Dynamically allocated heap memory via `malloc()` persists until explicitly freed via `free()`. Losing all references to it without calling `free()` causes a memory leak."
  },
  {
    id: "tcat-cs-191",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Medium",
    q: "What is the output of the following C code snippet?\n```c\nint x = 5;\nint y = ++x * 2;\nprintf(\"%d %d\", x, y);\n```",
    options: [
      "6 12",
      "5 10",
      "6 10",
      "5 12"
    ],
    correct: 0,
    explain: "The prefix increment `++x` increases x from 5 to 6 before evaluation. Then y = 6 * 2 = 12. Both x and y evaluate to 6 and 12."
  },
  {
    id: "tcat-cs-192",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Medium",
    q: "In C, what is the key functional difference between `malloc()` and `calloc()`?",
    options: [
      "`calloc()` initializes all allocated bytes to zero, whereas `malloc()` leaves memory uninitialized",
      "`malloc()` allocates memory from stack, whereas `calloc()` allocates from heap",
      "`calloc()` cannot allocate memory for arrays of structures",
      "`malloc()` requires two arguments while `calloc()` requires only one"
    ],
    correct: 0,
    explain: "`calloc(num, size)` zeroes out the entire allocated memory block before returning, whereas `malloc(size)` returns uninitialized memory containing indeterminate data."
  },
  {
    id: "tcat-cs-193",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Medium",
    q: "What does the `static` keyword indicate when applied to a local variable defined inside a C function?",
    options: [
      "The variable retains its value across multiple function invocations and persists throughout program execution",
      "The variable cannot be modified once initialized (read-only)",
      "The variable is stored in CPU registers for accelerated access",
      "The variable is visible to all functions across external source files"
    ],
    correct: 0,
    explain: "A `static` local variable is stored in the data segment rather than the stack; its lifetime extends across the entire program runtime, retaining its value across calls."
  },
  {
    id: "tcat-cs-194",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Hard",
    q: "What is the syntax for declaring a pointer to a function that takes two `int` parameters and returns a `double` in C/C++?",
    options: [
      "double (*funcPtr)(int, int);",
      "double *funcPtr(int, int);",
      "(*double) funcPtr(int, int);",
      "double funcPtr*(int, int);"
    ],
    correct: 0,
    explain: "Parentheses around `(*funcPtr)` are essential to bind the dereference operator to the identifier: `double (*funcPtr)(int, int);`. Without parentheses, it declares a function returning a `double*`."
  },
  {
    id: "tcat-cs-195",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Hard",
    q: "Consider the array declaration `int arr[3][4];`. What does the pointer expression `*(*(arr + 1) + 2)` evaluate to?",
    options: [
      "arr[1][2]",
      "arr[2][1]",
      "arr[3][2]",
      "arr[1][4]"
    ],
    correct: 0,
    explain: "In multidimensional array pointer arithmetic: `arr + 1` points to row 1, `*(arr + 1)` yields the base address of row 1, `*(arr + 1) + 2` points to column 2 of row 1, and dereferencing yields `arr[1][2]`."
  },
  {
    id: "tcat-cs-196",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Hard",
    q: "In C/C++, how does the memory allocation of a `union` differ fundamentally from that of a `struct`?",
    options: [
      "A union allocates memory equal only to its largest member, and all members share the same starting address",
      "A union allocates separate contiguous memory blocks for every individual member",
      "A union stores its members strictly in registers rather than RAM",
      "A union cannot contain primitive data types like int or float"
    ],
    correct: 0,
    explain: "In a `union`, all members overlap in memory at the exact same base address; the total size of the union is determined by the size of its largest member (plus alignment padding)."
  },
  {
    id: "tcat-cs-197",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Hard",
    q: "What dangerous condition is created when a pointer continues to store the memory address of an object that has already been deallocated with `free()`?",
    options: [
      "Dangling pointer",
      "Null pointer dereference",
      "Wild pointer",
      "Memory alignment exception"
    ],
    correct: 0,
    explain: "A dangling pointer points to a memory location that has already been deallocated. Dereferencing or writing through it leads to undefined behavior, data corruption, or security exploits."
  },
  {
    id: "tcat-cs-198",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Hard",
    q: "What is the output of the bitwise expression `(~0 << 3)` assuming an 8-bit signed integer format in 2's complement?",
    options: [
      "-8 (binary 11111000)",
      "-4 (binary 11111100)",
      "248 (unsigned only)",
      "-16 (binary 11110000)"
    ],
    correct: 0,
    explain: "~0 produces all 1s (11111111 in 8-bit). Left shifting by 3 positions yields 11111000. In 8-bit two's complement, 11111000 represents -8."
  },
  {
    id: "tcat-cs-199",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Easy",
    q: "Which linear data structure enforces a First-In, First-Out (FIFO) operational policy?",
    options: [
      "Queue",
      "Stack",
      "Binary Tree",
      "Max-Heap"
    ],
    correct: 0,
    explain: "A Queue enforces FIFO (First-In, First-Out), where elements are inserted at the rear (enqueue) and removed from the front (dequeue)."
  },
  {
    id: "tcat-cs-200",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Easy",
    q: "What is the average time complexity for accessing an element by index in an array of size n?",
    options: [
      "O(1)",
      "O(n)",
      "O(log n)",
      "O(n log n)"
    ],
    correct: 0,
    explain: "Because array elements are stored contiguously in memory, the address of index i is calculated directly via Base + (i * size), executing in constant time O(1)."
  },
  {
    id: "tcat-cs-201",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Easy",
    q: "In a singly linked list, what value does the `next` pointer of the terminal (last) node store?",
    options: [
      "NULL (or nullptr)",
      "The address of the head node",
      "0xFFFFFFFF",
      "The address of itself"
    ],
    correct: 0,
    explain: "In a standard non-circular singly linked list, the final node's `next` reference is set to NULL to signify the termination of the list."
  },
  {
    id: "tcat-cs-202",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Easy",
    q: "Which tree traversal visits the nodes in the order: Left Subtree -> Root -> Right Subtree?",
    options: [
      "In-order traversal",
      "Pre-order traversal",
      "Post-order traversal",
      "Level-order traversal"
    ],
    correct: 0,
    explain: "In-order traversal visits: (1) Left subtree, (2) Root node, (3) Right subtree. In a Binary Search Tree (BST), in-order traversal yields values in non-decreasing sorted order."
  },
  {
    id: "tcat-cs-203",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "What is the worst-case time complexity of Quick Sort when selecting the first element as the pivot on an already sorted array?",
    options: [
      "O(n^2)",
      "O(n log n)",
      "O(n)",
      "O(log n)"
    ],
    correct: 0,
    explain: "When an array of size n is already sorted and the pivot chosen is always the first (or last) element, partitions are maximally unbalanced (0 and n-1), resulting in O(n^2) worst-case time."
  },
  {
    id: "tcat-cs-204",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "In an AVL balanced search tree, what are the allowed values for the balance factor of any node (defined as Height(Left) - Height(Right))?",
    options: [
      "-1, 0, or +1",
      "-2, 0, or +2",
      "Strictly 0",
      "Any integer between -3 and +3"
    ],
    correct: 0,
    explain: "An AVL tree maintains the invariant that for every node, the heights of its left and right subtrees differ by at most 1, meaning the balance factor must be in {-1, 0, +1}."
  },
  {
    id: "tcat-cs-205",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "In a complete binary heap stored as an array with 0-based indexing, if a parent node resides at index `i`, at which index is its left child located?",
    options: [
      "2i + 1",
      "2i",
      "2i + 2",
      "i / 2"
    ],
    correct: 0,
    explain: "In 0-based array representation of a binary tree: Left child = 2i + 1, Right child = 2i + 2, and Parent = floor((i - 1) / 2)."
  },
  {
    id: "tcat-cs-206",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "Which graph traversal algorithm utilizes a FIFO Queue and systematically visits all vertices at distance k before exploring vertices at distance k+1?",
    options: [
      "Breadth-First Search (BFS)",
      "Depth-First Search (DFS)",
      "Dijkstra's Shortest Path",
      "Kruskal's Algorithm"
    ],
    correct: 0,
    explain: "Breadth-First Search (BFS) explores vertices level by level using a Queue, discovering all nodes at depth k before moving to depth k+1."
  },
  {
    id: "tcat-cs-207",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "What collision resolution strategy in Hash Tables chains multiple key-value pairs that hash to the exact same bucket into a linked list?",
    options: [
      "Separate Chaining",
      "Linear Probing",
      "Quadratic Probing",
      "Double Hashing"
    ],
    correct: 0,
    explain: "Separate Chaining resolves hash collisions by maintaining a linked list (or dynamic bucket) of all entries that map to the same hash index."
  },
  {
    id: "tcat-cs-208",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Hard",
    q: "What algorithm detects the presence of a cycle in a singly linked list in O(n) time and O(1) auxiliary space?",
    options: [
      "Floyd's Cycle-Finding Algorithm (Tortoise and Hare)",
      "Tarjan's Strongly Connected Components Algorithm",
      "Bellman-Ford Cycle Relaxation Algorithm",
      "Kosaraju's Two-Pass Algorithm"
    ],
    correct: 0,
    explain: "Floyd's cycle-finding algorithm moves two pointers at different speeds (slow by 1 step, fast by 2 steps); if a cycle exists, they must collide in O(n) time using O(1) extra space."
  },
  {
    id: "tcat-cs-209",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Hard",
    q: "In an AVL tree, when an insertion into the right subtree of the left child of node A causes an imbalance (Balance Factor of A = +2), which double rotation restores balance?",
    options: [
      "Left-Right (LR) rotation",
      "Right-Left (RL) rotation",
      "Single Left (LL) rotation",
      "Single Right (RR) rotation"
    ],
    correct: 0,
    explain: "A Left-Right (LR) imbalance requires a double rotation: first a Left rotation on the left child, followed by a Right rotation on the unbalance parent node A."
  },
  {
    id: "tcat-cs-210",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Hard",
    q: "What is the tight asymptotic time complexity of building a binary heap from an arbitrary unordered array of n elements using the bottom-up `buildHeap()` procedure?",
    options: [
      "O(n)",
      "O(n log n)",
      "O(log n)",
      "O(n^2)"
    ],
    correct: 0,
    explain: "Bottom-up heap building calls sift-down on nodes starting from n/2 down to 1. The sum of (height * number of nodes at height) converges to O(n), running in linear time."
  },
  {
    id: "tcat-cs-211",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Hard",
    q: "In a Red-Black Tree, what is the maximum possible height of a tree containing n internal nodes?",
    options: [
      "2 log_2(n + 1)",
      "log_2(n + 1)",
      "n / 2",
      "1.44 log_2(n)"
    ],
    correct: 0,
    explain: "Because no two red nodes can be consecutive and every path has the same black-height, the maximum possible height of a Red-Black tree with n nodes is strictly 2 log_2(n + 1)."
  },
  {
    id: "tcat-cs-212",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Easy",
    q: "Which logic gate outputs a HIGH (1) signal if and only if both of its binary inputs are HIGH (1)?",
    options: [
      "AND gate",
      "OR gate",
      "XOR gate",
      "NAND gate"
    ],
    correct: 0,
    explain: "An AND gate performs logical multiplication; its output Y = A · B is 1 only when both A = 1 and B = 1."
  },
  {
    id: "tcat-cs-213",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Easy",
    q: "Applying De Morgan's generalized theorem to a three-variable product, what is the equivalent Boolean expression for `(A · B · C)'`?",
    options: [
      "A' + B' + C'",
      "A' · B' · C'",
      "(A + B + C)'",
      "A + B + C"
    ],
    correct: 0,
    explain: "De Morgan's generalized product theorem states that the complement of a product of variables equals the logical sum of their individual complements: (A · B · C)' = A' + B' + C'."
  },
  {
    id: "tcat-cs-214",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Easy",
    q: "Why are NAND and NOR gates designated as \"universal gates\" in digital electronics?",
    options: [
      "Because any Boolean logic function or basic gate (AND, OR, NOT) can be synthesized using exclusively NAND or NOR gates",
      "Because they operate at universal line voltage across all integrated circuits",
      "Because their propagation delay is universally zero nanoseconds",
      "Because they possess three or more inputs by default"
    ],
    correct: 0,
    explain: "NAND and NOR are universal gates because complete sets of Boolean operations (AND, OR, NOT) can be constructed solely from combinations of either gate alone."
  },
  {
    id: "tcat-cs-215",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Easy",
    q: "Simplify the Boolean algebraic expression: `A + A'B`:",
    options: [
      "A + B",
      "A · B",
      "A' + B",
      "B"
    ],
    correct: 0,
    explain: "By the absorption/distributive law: A + A'B = (A + A')(A + B) = (1)(A + B) = A + B."
  },
  {
    id: "tcat-cs-216",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Medium",
    q: "In a 2-input Exclusive-OR (XOR) gate, what is the output when input A = 1 and input B = 1?",
    options: [
      "0",
      "1",
      "High Impedance (Z)",
      "Indeterminate"
    ],
    correct: 0,
    explain: "XOR outputs 1 when the inputs are different (odd parity). When A = 1 and B = 1, the inputs are identical, yielding output 0 (1 XOR 1 = 0)."
  },
  {
    id: "tcat-cs-217",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Medium",
    q: "How many 2-input NAND gates are required to construct a single 2-input XOR gate?",
    options: [
      "4",
      "3",
      "5",
      "2"
    ],
    correct: 0,
    explain: "A 2-input XOR gate (A'B + AB') can be synthesized using a minimum of 4 two-input NAND gates in a standard cross-coupled architecture."
  },
  {
    id: "tcat-cs-218",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Medium",
    q: "In a Karnaugh Map (K-map), why are adjacent rows and columns arranged using Gray code sequence (00, 01, 11, 10)?",
    options: [
      "To ensure that adjacent cells differ by exactly one single binary variable change",
      "To accelerate binary arithmetic computation inside the ALU",
      "To reduce the total number of cells required for 4 variables",
      "To eliminate static hazards in sequential flip-flops"
    ],
    correct: 0,
    explain: "Gray code ensures that adjacent physical cells in the K-map grid differ by a single bit change, enabling adjacent grouping to algebraically eliminate that changing variable."
  },
  {
    id: "tcat-cs-219",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Medium",
    q: "What logic circuit computes the Sum and Carry-out for three single-bit binary inputs (A, B, and Carry-in)?",
    options: [
      "Full Adder",
      "Half Adder",
      "Magnitude Comparator",
      "Multiplexer"
    ],
    correct: 0,
    explain: "A Full Adder accepts three 1-bit binary inputs (A, B, and C_in) and generates two outputs: Sum = A XOR B XOR C_in and Carry_out = AB + C_in(A XOR B)."
  },
  {
    id: "tcat-cs-220",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Hard",
    q: "What is the \"race-around condition\" in an edge-sensitive JK flip-flop, and how is it resolved?",
    options: [
      "When J=1, K=1 and clock pulse width exceeds propagation delay, output toggles uncontrollably; resolved by using Master-Slave configuration",
      "When J=0, K=0 causing output to stay high impedance; resolved by adding pull-up resistors",
      "When clock frequency drops to zero; resolved by adding dynamic refresh capacitors",
      "When both inputs become undefined; resolved by connecting XOR feedback"
    ],
    correct: 0,
    explain: "Race-around occurs in level-triggered JK flip-flops when J=1, K=1: output toggles repeatedly while the clock is high. Master-Slave or edge-triggering eliminates this anomaly."
  },
  {
    id: "tcat-cs-221",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Hard",
    q: "How many selection lines are required for a multiplexer (MUX) designed to route 32 distinct data input channels to a single output line?",
    options: [
      "5",
      "4",
      "6",
      "32"
    ],
    correct: 0,
    explain: "A multiplexer with N input channels requires m selection lines where 2^m >= N. For N = 32 channels, 2^5 = 32, so exactly 5 select lines are required."
  },
  {
    id: "tcat-cs-222",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Hard",
    q: "In a 4-variable K-map, what is the algebraic effect of grouping 8 adjacent 1s into an octet?",
    options: [
      "It eliminates 3 variables, producing a simplified product term with 1 variable",
      "It eliminates 2 variables, producing a product term with 2 variables",
      "It eliminates 4 variables, leaving a constant 1",
      "It yields an exclusive OR term of all 4 variables"
    ],
    correct: 0,
    explain: "Grouping 2^k adjacent cells in an n-variable K-map eliminates k variables. For an octet (2^3 = 8 cells) in a 4-variable map, k = 3 variables are eliminated, leaving 4 - 3 = 1 variable."
  },
  {
    id: "tcat-cs-223",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Hard",
    q: "What is the characteristic equation of a Toggle (T) flip-flop, expressing the next state Q(t+1) in terms of T and current state Q(t)?",
    options: [
      "Q(t+1) = T XOR Q(t) = T · Q'(t) + T' · Q(t)",
      "Q(t+1) = T · Q(t)",
      "Q(t+1) = T + Q(t)",
      "Q(t+1) = T' · Q'(t)"
    ],
    correct: 0,
    explain: "When T = 0, Q(t+1) = Q(t) (hold); when T = 1, Q(t+1) = Q'(t) (toggle). This is represented algebraically by the XOR relationship: Q(t+1) = T XOR Q(t)."
  },
  {
    id: "tcat-cs-224",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Hard",
    q: "In combinational logic hazard analysis, what constitutes a \"static 1-hazard\"?",
    options: [
      "An output momentarily drops to 0 when it was expected to remain constantly at 1 during an input transition",
      "An output momentarily glitches to 1 when it was expected to remain constantly at 0",
      "An output oscillates indefinitely between 0 and 1 without settling",
      "A gate output remains locked at 1 due to physical substrate short circuit"
    ],
    correct: 0,
    explain: "A static 1-hazard occurs when an output is supposed to remain steady at logic 1 during an input transition between adjacent K-map groupings, but momentarily glitches to 0 due to unequal path delays."
  },
  {
    id: "tcat-cs-225",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Easy",
    q: "How many functional layers comprise the ISO Open Systems Interconnection (OSI) reference model?",
    options: [
      "7 layers",
      "4 layers",
      "5 layers",
      "6 layers"
    ],
    correct: 0,
    explain: "The OSI model defines 7 distinct architectural layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application."
  },
  {
    id: "tcat-cs-226",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Easy",
    q: "Which protocol is responsible for resolving a human-readable domain name (e.g., www.uettaxila.edu.pk) into a numerical IP address?",
    options: [
      "DNS (Domain Name System)",
      "DHCP",
      "ARP",
      "SNMP"
    ],
    correct: 0,
    explain: "DNS (Domain Name System) functions as the directory service of the Internet, mapping alphabetical domain names to their respective IP addresses."
  },
  {
    id: "tcat-cs-227",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Easy",
    q: "What is the standard length in bits of an IPv4 address compared to an IPv6 address?",
    options: [
      "IPv4 is 32 bits; IPv6 is 128 bits",
      "IPv4 is 64 bits; IPv6 is 128 bits",
      "IPv4 is 32 bits; IPv6 is 64 bits",
      "IPv4 is 16 bits; IPv6 is 32 bits"
    ],
    correct: 0,
    explain: "An IPv4 address is 32 bits long (formatted as 4 octets), whereas an IPv6 address is 128 bits long (formatted as 8 groups of 4 hexadecimal digits)."
  },
  {
    id: "tcat-cs-228",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Easy",
    q: "Which Transport layer protocol provides connectionless, best-effort packet delivery with minimal transmission latency?",
    options: [
      "UDP (User Datagram Protocol)",
      "TCP (Transmission Control Protocol)",
      "BGP",
      "FTP"
    ],
    correct: 0,
    explain: "UDP is a lightweight, connectionless protocol with minimal packet header overhead (8 bytes) that transmits datagrams without establishing handshakes or error retransmission."
  },
  {
    id: "tcat-cs-229",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Medium",
    q: "In IPv4 subnetting with CIDR notation, how many usable host IP addresses are available in a `/26` subnet?",
    options: [
      "62 hosts",
      "64 hosts",
      "30 hosts",
      "126 hosts"
    ],
    correct: 0,
    explain: "A /26 subnet has 32 - 26 = 6 host bits. Total IP addresses = 2^6 = 64. Subtracting the network address and broadcast address yields 64 - 2 = 62 usable host addresses."
  },
  {
    id: "tcat-cs-230",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Medium",
    q: "What protocol maps an IP address at the Network layer to a physical MAC address at the Data Link layer on a local network?",
    options: [
      "ARP (Address Resolution Protocol)",
      "RARP",
      "ICMP",
      "IGMP"
    ],
    correct: 0,
    explain: "ARP broadcasts on the local physical network to resolve a known logical IPv4 address to its corresponding physical hardware MAC address."
  },
  {
    id: "tcat-cs-231",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Medium",
    q: "What sequential packet exchange establishes a reliable connection in the TCP 3-way handshake?",
    options: [
      "SYN -> SYN-ACK -> ACK",
      "SYN -> ACK -> DATA",
      "ACK -> SYN -> SYN-ACK",
      "RST -> SYN -> ACK"
    ],
    correct: 0,
    explain: "The client sends a SYN packet, the server responds with a SYN-ACK packet, and the client confirms with an ACK packet, establishing synchronized sequence numbers."
  },
  {
    id: "tcat-cs-232",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Medium",
    q: "Which routing protocol is categorized as a Link-State protocol that utilizes Dijkstra's algorithm to compute shortest paths?",
    options: [
      "OSPF (Open Shortest Path First)",
      "RIP (Routing Information Protocol)",
      "EGP (Exterior Gateway Protocol)",
      "BGP"
    ],
    correct: 0,
    explain: "OSPF is an Interior Gateway Protocol that floods Link State Advertisements (LSAs) and uses Dijkstra's Shortest Path First (SPF) algorithm to calculate optimal routes."
  },
  {
    id: "tcat-cs-233",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Medium",
    q: "In network security, how does asymmetric (public-key) cryptography differ fundamentally from symmetric cryptography?",
    options: [
      "Asymmetric encryption uses a mathematically related key pair (public key for encryption, private key for decryption)",
      "Asymmetric encryption uses the exact same shared secret key for both encryption and decryption",
      "Asymmetric encryption can only operate over physical copper wires",
      "Asymmetric encryption does not utilize mathematical modular arithmetic"
    ],
    correct: 0,
    explain: "Asymmetric cryptography utilizes a key pair: the public key encrypts data, and only the corresponding private key can decrypt it, eliminating the requirement to share a secret key."
  },
  {
    id: "tcat-cs-234",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Hard",
    q: "In CSMA/CD local area network protocol, what mechanism do nodes use to resolve transmission collisions on shared bus media?",
    options: [
      "Binary Exponential Backoff algorithm",
      "Token passing ring rotation",
      "Round-robin priority polling",
      "Fixed time division multiplexing slots"
    ],
    correct: 0,
    explain: "Upon detecting a collision, transmitting nodes send a jam signal and invoke the Binary Exponential Backoff algorithm, waiting a random delay chosen from [0, 2^k - 1] slot times."
  },
  {
    id: "tcat-cs-235",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Hard",
    q: "What is the primary function of Network Address Translation (NAT) in modern IPv4 edge routers?",
    options: [
      "To map multiple private RFC 1918 IP addresses inside a local network to one or more public globally routable IP addresses",
      "To convert digital packet data into optical signals for fiber conduits",
      "To automatically assign IP addresses to new host devices via lease renewals",
      "To encrypt all payload data passing through router interfaces"
    ],
    correct: 0,
    explain: "NAT (specifically NAPT / Port Address Translation) maps multiple private IP addresses inside a local area network to a single public IP address using distinct port numbers, conserving IPv4 space."
  },
  {
    id: "tcat-cs-236",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Hard",
    q: "In TCP congestion control, what event causes the sender to enter Fast Recovery rather than resetting the Congestion Window (cwnd) to 1 MSS?",
    options: [
      "Receipt of 3 duplicate ACKs indicating a single packet loss without retransmission timeout",
      "Expiration of the Retransmission Timeout (RTO) timer",
      "Receiving a TCP Reset (RST) flag from the server",
      "When the receiver window (rwnd) becomes 0"
    ],
    correct: 0,
    explain: "Receipt of 3 duplicate ACKs indicates that subsequent packets are still reaching the receiver; TCP invokes Fast Retransmit and Fast Recovery, cutting cwnd in half rather than resetting it to 1."
  },
  {
    id: "tcat-cs-237",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Hard",
    q: "In public key infrastructure (PKI) for HTTPS, how does a client browser verify that a website's TLS certificate is authentic?",
    options: [
      "By validating the digital signature using the public key embedded in the trusted Certificate Authority (CA) root certificate pre-installed in the browser/OS",
      "By sending a ping packet to the DNS root servers",
      "By decrypting the certificate with the website's private key",
      "By calculating the SHA-256 hash of the web server's MAC address"
    ],
    correct: 0,
    explain: "The client validates the digital signature on the certificate using the pre-installed public key of the issuing Certificate Authority (CA), verifying trust through a cryptographic chain of trust."
  },
  {
    id: "tcat-cs-238",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Easy",
    q: "Which attribute in a relational database table uniquely identifies each individual record row?",
    options: [
      "Primary Key",
      "Foreign Key",
      "Alternate Key",
      "Secondary Index"
    ],
    correct: 0,
    explain: "A Primary Key uniquely identifies each row in a relation, enforcing the Entity Integrity constraint (cannot contain NULL values and must be unique)."
  },
  {
    id: "tcat-cs-239",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Easy",
    q: "Which SQL clause is used to filter individual rows BEFORE any grouping or aggregate functions are applied?",
    options: [
      "WHERE",
      "HAVING",
      "GROUP BY",
      "ORDER BY"
    ],
    correct: 0,
    explain: "The `WHERE` clause filters individual records before grouping occurs, whereas `HAVING` filters aggregated groups after `GROUP BY` is performed."
  },
  {
    id: "tcat-cs-240",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Easy",
    q: "What relational constraint is enforced when a foreign key references the primary key of another table?",
    options: [
      "Referential Integrity",
      "Entity Integrity",
      "Domain Integrity",
      "Key Constraint"
    ],
    correct: 0,
    explain: "Referential integrity mandates that every foreign key value in a referencing table must either match an existing primary key value in the referenced table or be NULL."
  },
  {
    id: "tcat-cs-241",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Easy",
    q: "Which SQL statement is used to permanently remove an entire table structure along with all its data rows from the database catalog?",
    options: [
      "DROP TABLE",
      "DELETE FROM TABLE",
      "TRUNCATE TABLE",
      "REMOVE TABLE"
    ],
    correct: 0,
    explain: "`DROP TABLE` is a DDL command that destroys the table schema definition, metadata, and all stored data, permanently removing it from the database catalog."
  },
  {
    id: "tcat-cs-242",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Medium",
    q: "In database normalization, what condition must a table satisfy to be in Second Normal Form (2NF)?",
    options: [
      "It must be in 1NF and have no partial functional dependencies (all non-key attributes must fully depend on the entire candidate key)",
      "It must have no transitive dependencies between non-key attributes",
      "All determinants must be candidate keys",
      "It must contain zero multi-valued attributes and no arrays"
    ],
    correct: 0,
    explain: "2NF requires that the relation is in 1NF and contains no partial dependencies: every non-prime attribute must depend on the whole of every candidate key."
  },
  {
    id: "tcat-cs-243",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Medium",
    q: "What ACID property guarantees that all operations within a database transaction either execute completely or roll back entirely with no partial state?",
    options: [
      "Atomicity",
      "Consistency",
      "Isolation",
      "Durability"
    ],
    correct: 0,
    explain: "Atomicity dictates that a transaction is treated as an indivisible unit of work: either all operations succeed and commit, or all fail and roll back (all-or-nothing)."
  },
  {
    id: "tcat-cs-244",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Medium",
    q: "In relational algebra, which operator retrieves a vertical subset of specified columns from a relation table?",
    options: [
      "Projection (π)",
      "Selection (σ)",
      "Cartesian Product (×)",
      "Join (⋈)"
    ],
    correct: 0,
    explain: "Projection (denoted by Greek letter π) selects specified columns (vertical slice) from a relation, discarding all other attributes and eliminating duplicate rows."
  },
  {
    id: "tcat-cs-245",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Medium",
    q: "What is the key difference between a Clustered Index and a Non-Clustered Index in relational database storage?",
    options: [
      "A clustered index physically sorts and stores data rows in the table, so only one can exist per table",
      "A non-clustered index physically reorders table data rows on disk",
      "A clustered index stores data in external hash buckets instead of B-trees",
      "A non-clustered index cannot be created on primary key columns"
    ],
    correct: 0,
    explain: "A clustered index determines the physical storage order of rows in the table; hence, only one clustered index can exist per table. Non-clustered indexes store pointers to row locations."
  },
  {
    id: "tcat-cs-246",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Hard",
    q: "What functional dependency condition defines Boyce-Codd Normal Form (BCNF)?",
    options: [
      "For every non-trivial functional dependency X -> Y, X must be a superkey",
      "For every functional dependency X -> Y, Y must be a prime attribute",
      "There must be no multi-valued dependencies",
      "All transitive dependencies must be resolved into binary relations"
    ],
    correct: 0,
    explain: "A relation is in Boyce-Codd Normal Form (BCNF) if and only if for every non-trivial functional dependency X -> Y, the determinant X is a superkey."
  },
  {
    id: "tcat-cs-247",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Hard",
    q: "What concurrency anomaly occurs when Transaction A rereads a range of rows and discovers new rows inserted and committed by Transaction B?",
    options: [
      "Phantom Read",
      "Dirty Read",
      "Non-Repeatable Read",
      "Lost Update"
    ],
    correct: 0,
    explain: "A Phantom Read occurs when a transaction queries a range of rows twice and retrieves a different set of rows the second time because another transaction inserted and committed new rows."
  },
  {
    id: "tcat-cs-248",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Hard",
    q: "In transaction recovery protocols, what rule does the Write-Ahead Logging (WAL) protocol mandate?",
    options: [
      "Log records representing database modifications must be flushed to stable storage BEFORE the corresponding modified data pages are written to disk",
      "All transactions must be completed in memory before any log records are created",
      "Log records are written only upon system shutdown",
      "Data pages are mirrored to two separate disks synchronously without logging"
    ],
    correct: 0,
    explain: "Write-Ahead Logging (WAL) mandates that before a modified data page is written from cache to non-volatile disk, the corresponding log record must be safely persisted to stable storage."
  },
  {
    id: "tcat-cs-249",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Hard",
    q: "In the Two-Phase Locking (2PL) protocol, what guarantees conflict serializability of concurrent transactions?",
    options: [
      "A transaction cannot acquire any new lock once it has released any existing lock (strict separation into Growing and Shrinking phases)",
      "All locks are converted into shared read locks upon transaction commit",
      "Every transaction acquires exclusive locks on all tables at start",
      "Locks are released in random order to prevent circular waits"
    ],
    correct: 0,
    explain: "Two-Phase Locking divides a transaction into a growing phase (locks are only acquired) and a shrinking phase (locks are only released). Once a lock is released, no new lock can be acquired."
  },
  {
    id: "tcat-cs-250",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Hard",
    q: "What is the result of the relational algebra Division operator (R ÷ S) where relation R has schema (A, B) and S has schema (B)?",
    options: [
      "The set of all tuples in projection π_A(R) that are paired with EVERY tuple present in relation S",
      "The Cartesian product of R and S without duplicates",
      "The intersection of values in column A and column B",
      "The outer join of R and S on foreign key equality"
    ],
    correct: 0,
    explain: "Relational division R ÷ S returns the values of attribute A that appear in R associated with all values of attribute B present in S (useful for queries like \"find students enrolled in all courses\")."
  },
  {
    id: "tcat-cs-251",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Easy",
    q: "What is the binary representation of the decimal integer 43?",
    options: ["101011","101101","110011","100111"],
    correct: 0,
    explain: "43 in powers of 2: 32 + 8 + 2 + 1 = 2^5 + 2^3 + 2^1 + 2^0, giving binary 101011_2."
  },
  {
    id: "tcat-cs-252",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Easy",
    q: "In computer architecture, what type of memory is volatile and loses its stored contents immediately when electrical power is interrupted?",
    options: ["RAM (Random Access Memory)","ROM (Read-Only Memory)","Flash EEPROM","Magnetic Hard Disk"],
    correct: 0,
    explain: "RAM is volatile semiconductor memory that requires continuous electrical power to preserve stored data bits."
  },
  {
    id: "tcat-cs-253",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Easy",
    q: "What CPU register stores the memory address of the next sequential machine instruction scheduled to be fetched and executed?",
    options: ["Program Counter (PC)","Instruction Register (IR)","Memory Buffer Register (MBR)","Accumulator (AC)"],
    correct: 0,
    explain: "The Program Counter (PC) automatically holds and increments the memory address of the upcoming instruction in the fetch-decode-execute cycle."
  },
  {
    id: "tcat-cs-254",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Easy",
    q: "Convert the hexadecimal value 0x2E into its decimal equivalent:",
    options: ["46","38","44","52"],
    correct: 0,
    explain: "0x2E = (2 * 16^1) + (14 * 16^0) = 32 + 14 = 46."
  },
  {
    id: "tcat-cs-255",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Medium",
    q: "Using 8-bit two's complement binary representation, what decimal value does the bit pattern 11101100_2 represent?",
    options: ["-20","-18","-36","-12"],
    correct: 0,
    explain: "The sign bit is 1 (negative). Invert the bits: 00010011, add 1: 00010100 (which is 16 + 4 = 20). Thus the value is -20."
  },
  {
    id: "tcat-cs-256",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Medium",
    q: "In the IEEE 754 single-precision (32-bit) floating-point standard, how are the 32 bits apportioned across sign, exponent, and mantissa?",
    options: ["1 sign bit, 8 exponent bits (bias 127), 23 fraction/mantissa bits","1 sign bit, 11 exponent bits, 20 fraction bits","2 sign bits, 7 exponent bits, 23 fraction bits","1 sign bit, 10 exponent bits, 21 fraction bits"],
    correct: 0,
    explain: "IEEE 754 32-bit format allocates bit 31 to sign, bits 30-23 (8 bits) to biased exponent (bias = 127), and bits 22-0 (23 bits) to the fractional significand."
  },
  {
    id: "tcat-cs-257",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Medium",
    q: "What is the primary operational advantage of Direct Memory Access (DMA) controllers in modern microcomputers?",
    options: ["Transfers high-volume data blocks between I/O peripherals and main RAM without constant CPU interrupt intervention","Eliminates the physical need for primary RAM","Executes floating-point arithmetic instructions faster than the ALU","Permanently flashes firmware without consuming bus cycles"],
    correct: 0,
    explain: "DMA bypasses the CPU for bulk data transfers between peripheral devices and system memory, freeing the CPU to execute instructions concurrently."
  },
  {
    id: "tcat-cs-258",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Medium",
    q: "According to Amdahl's Law, what is the theoretical maximum speedup of a program if 75% of its execution time is parallelizable across an infinite number of processor cores?",
    options: ["4.0x","1.33x","2.5x","Infinite speedup"],
    correct: 0,
    explain: "Speedup S = 1 / ((1 - P) + P/N). With P = 0.75 and N -> infinity, S = 1 / (1 - 0.75) = 1 / 0.25 = 4.0x."
  },
  {
    id: "tcat-cs-259",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "In a 4-way set-associative cache memory system with 32-bit physical addresses, a 64 KB cache size, and 64-byte cache lines, how many bits are used for the tag field?",
    options: ["18 bits","16 bits","20 bits","14 bits"],
    correct: 0,
    explain: "Cache line size = 64 bytes = 2^6 bytes -> Offset = 6 bits. Number of lines = 64 KB / 64 B = 1024 lines. Since it is 4-way set associative, Number of sets = 1024 / 4 = 256 sets = 2^8 sets -> Index = 8 bits. Tag bits = 32 - (Offset + Index) = 32 - (6 + 8) = 18 bits."
  },
  {
    id: "tcat-cs-260",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "Which pipeline hazard occurs when an instruction depends on the numerical result of a previous instruction that is still in flight through the pipeline?",
    options: ["Data hazard (Read-After-Write / RAW)","Structural hazard","Control branch hazard","Instruction cache fault"],
    correct: 0,
    explain: "A Data Hazard (specifically Read-After-Write or RAW dependency) arises when an operand has not yet been computed or forwarded from write-back stages."
  },
  {
    id: "tcat-cs-261",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "In virtual memory systems utilizing paged segmentation with Translation Lookaside Buffers (TLB), what constitutes a TLB hit versus a page fault?",
    options: ["A TLB hit finds the physical frame translation in high-speed hardware cache; a page fault occurs when the referenced page is not present in physical RAM","A TLB hit writes directly to disk; a page fault resets the system bus","A TLB hit invalidates cache lines; a page fault recalculates the effective address","Both terms denote identical hardware exceptions during instruction fetch"],
    correct: 0,
    explain: "TLB hit retrieves the page-to-frame translation in CPU associative cache. If the page is not in physical RAM (present bit = 0 in page table), an MMU page fault interrupt fetches it from disk."
  },
  {
    id: "tcat-cs-262",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "In microarchitecture design, what differentiates superscalar execution from pipelined vector execution?",
    options: ["Superscalar processors dynamically issue multiple independent scalar instructions per clock cycle to multiple functional units","Superscalar processors only process one instruction every two clock cycles","Vector execution cannot perform SIMD data processing","Superscalar architecture relies exclusively on software compilers rather than hardware dispatch logic"],
    correct: 0,
    explain: "Superscalar CPUs incorporate dynamic instruction issue logic that inspects data dependencies at runtime to dispatch multiple instructions concurrently to parallel execution pipelines."
  },
  {
    id: "tcat-cs-263",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "How does Hamming single-error-correction double-error-detection (SEC-DED) encode parity to detect two simultaneous bit corruptions?",
    options: ["By appending an overall parity bit covering all message and parity bits in addition to the standard Hamming parity check bits","By interleaving cyclic redundancy checks every four bytes","By duplicating the entire data word twice in adjacent memory addresses","By using Gray codes instead of binary representation"],
    correct: 0,
    explain: "SEC-DED appends an additional global parity bit over the entire codeword. If standard syndromes indicate an error but global parity is even, a double-bit error is detected."
  },
  {
    id: "tcat-cs-264",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "In C++, which keyword is used to declare an immutable constant variable whose value cannot be modified after initialization?",
    options: ["const","static","volatile","mutable"],
    correct: 0,
    explain: "The \"const\" qualifier in C++ specifies that a variable's value is read-only and immutable after its initial definition."
  },
  {
    id: "tcat-cs-265",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "What is the output of the following C++ code snippet?\nint a = 7, b = 2;\nstd::cout << a / b;",
    options: ["3","3.5","4","3.0"],
    correct: 0,
    explain: "Integer division in C++ truncates any fractional component toward zero; 7 / 2 evaluates to the integer 3."
  },
  {
    id: "tcat-cs-266",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "Which operator is used to obtain the memory address of an existing variable in C++?",
    options: ["& (Address-of operator)","* (Dereference operator)","-> (Arrow operator)",":: (Scope resolution operator)"],
    correct: 0,
    explain: "The unary ampersand \"&\" operator returns the hexadecimal memory address of its operand variable."
  },
  {
    id: "tcat-cs-267",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "What is the minimum number of times the body of a do-while loop executes in C++?",
    options: ["At least 1 time","0 times","2 times","Depends on condition"],
    correct: 0,
    explain: "Because a do-while loop evaluates its termination condition at the bottom (post-test), its body is guaranteed to execute at least once."
  },
  {
    id: "tcat-cs-268",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "What does the break statement accomplish when executed inside a nested loop in C++?",
    options: ["Terminates only the innermost enclosing loop immediately","Terminates all outer loops simultaneously","Skips only the current iteration and continues with the next","Exits the program entirely"],
    correct: 0,
    explain: "The break statement exits strictly from the innermost enclosing loop or switch construct, transferring control to the statement immediately following that loop."
  },
  {
    id: "tcat-cs-269",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Medium",
    q: "What is the output of the following recursive function call mystery(4)?\nint mystery(int n) {\n  if (n <= 1) return 1;\n  return n * mystery(n - 1);\n}",
    options: ["24","10","12","16"],
    correct: 0,
    explain: "mystery(4) calculates factorial(4) = 4 * mystery(3) = 4 * 3 * mystery(2) = 4 * 3 * 2 * 1 = 24."
  },
  {
    id: "tcat-cs-270",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Medium",
    q: "What is the fundamental difference between passing a variable by value versus passing by reference in C++ functions?",
    options: ["Pass by value passes a copy of the argument, while pass by reference passes an alias to the original memory location","Pass by reference creates a duplicate in stack memory","Pass by value allows the function to modify the caller's actual variable","Pass by reference is only supported for primitive float types"],
    correct: 0,
    explain: "Pass-by-value copies data into the parameter, protecting original variables from modification. Pass-by-reference (&) provides direct access to the caller's memory address."
  },
  {
    id: "tcat-cs-271",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Medium",
    q: "In C++ Object-Oriented Programming, which member access specifier allows member variables to be accessed only within the declaring class and its derived subclasses?",
    options: ["protected","private","public","friend"],
    correct: 0,
    explain: "\"protected\" members are inaccessible from external client code but remain accessible to member functions of the base class and any derived derived classes."
  },
  {
    id: "tcat-cs-272",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Medium",
    q: "What will be printed by the following pointer arithmetic in C++?\nint arr[] = {10, 20, 30, 40, 50};\nint *ptr = arr;\nptr += 2;\nstd::cout << *(ptr + 1);",
    options: ["40","30","50","20"],
    correct: 0,
    explain: "ptr originally points to arr[0]. ptr += 2 moves ptr to arr[2] (value 30). *(ptr + 1) dereferences arr[3], which is 40."
  },
  {
    id: "tcat-cs-273",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Hard",
    q: "Why should a base class containing virtual member functions always declare a virtual destructor in C++?",
    options: ["To ensure that deleting a derived class object through a base class pointer invokes the derived class destructor, preventing memory leaks","To prevent the derived class from inheriting member variables","Because the C++ compiler issues a syntax error without it","To allocate derived objects exclusively in the text segment"],
    correct: 0,
    explain: "Deleting a derived instance via a Base* pointer without a virtual destructor causes undefined behavior and fails to invoke the derived destructor, causing resource leaks."
  },
  {
    id: "tcat-cs-274",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Hard",
    q: "In C++11 and later, what does move semantics (std::move) achieve compared to copy semantics?",
    options: ["Transfers ownership of underlying dynamic resources from an rvalue temporary object without performing deep heap allocations","Compiles code into multi-threaded assembly instructions automatically","Copies all pointer targets byte-by-byte into new memory","Forces variables to be stored in CPU registers"],
    correct: 0,
    explain: "Move semantics casts an expression to an rvalue reference (T&&), enabling move constructors to steal dynamic buffers (shallow pointer swap) instead of performing expensive deep copying."
  },
  {
    id: "tcat-cs-275",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Hard",
    q: "How does the C++ virtual table (vtable) mechanism resolve polymorphic dynamic function dispatch at runtime?",
    options: ["Each polymorphic class has a static table of function pointers; instances store a hidden vptr pointer directed to their class vtable","The compiler inserts switch-case statements comparing type strings at every call site","Dynamic dispatch is executed by the operating system kernel via software interrupts","Virtual functions are re-compiled on the fly in memory before invocation"],
    correct: 0,
    explain: "Classes with virtual methods maintain a vtable containing function pointers. Each object stores an internal vptr pointing to its class vtable, dereferenced at runtime to resolve overrides."
  },
  {
    id: "tcat-cs-276",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Hard",
    q: "What is the RAII (Resource Acquisition Is Initialization) paradigm in modern C++ software design?",
    options: ["Binding the lifecycle of a resource (memory, file handle, socket) strictly to object lifetime so destructors automatically release it on scope exit","Initializing all variables to null before program startup","Allocating all memory exclusively using malloc() in main()","Running automated memory garbage collection cycles in background threads"],
    correct: 0,
    explain: "RAII binds resource allocation to object construction and resource deallocation to object destruction (e.g., std::unique_ptr, std::lock_guard), guaranteeing leak-free exception safety."
  },
  {
    id: "tcat-cs-277",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Easy",
    q: "Which data structure operates strictly under the Last-In, First-Out (LIFO) access principle?",
    options: ["Stack","Queue","Array","Linked List"],
    correct: 0,
    explain: "A stack is a linear data structure adhering strictly to LIFO (Last-In, First-Out), where push and pop operations occur only at the top."
  },
  {
    id: "tcat-cs-278",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Easy",
    q: "What is the worst-case time complexity of finding an element in an unsorted contiguous array of size n using Linear Search?",
    options: ["O(n)","O(log n)","O(1)","O(n^2)"],
    correct: 0,
    explain: "In the worst case, Linear Search must scan every element up to the nth item sequentially, resulting in O(n) linear time complexity."
  },
  {
    id: "tcat-cs-279",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Easy",
    q: "Which data structure operates under the First-In, First-Out (FIFO) principle for scheduling tasks?",
    options: ["Queue","Stack","Binary Tree","Max Heap"],
    correct: 0,
    explain: "A queue enqueues items at its rear and dequeues items from its front, embodying First-In, First-Out (FIFO) semantics."
  },
  {
    id: "tcat-cs-280",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Easy",
    q: "In a singly linked list, what does the next pointer of the final (tail) node store to signify the end of the list?",
    options: ["nullptr (or NULL)","The memory address of the head node","0xFFFFFFFF","A pointer to itself"],
    correct: 0,
    explain: "The tail node in a singly linked list points to nullptr (NULL), indicating that no further nodes exist in the sequence."
  },
  {
    id: "tcat-cs-281",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "What is the average-case time complexity of searching for a target key in a balanced Binary Search Tree (BST) containing n nodes?",
    options: ["O(log n)","O(n)","O(1)","O(n log n)"],
    correct: 0,
    explain: "In a balanced BST (such as an AVL or Red-Black tree), the tree height is logarithmic (h = log_2 n), ensuring O(log n) average search complexity."
  },
  {
    id: "tcat-cs-282",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "Which sorting algorithm divides an array into halves, sorts them recursively, and combines them with guaranteed O(n log n) worst-case time complexity?",
    options: ["Merge Sort","Quick Sort","Bubble Sort","Insertion Sort"],
    correct: 0,
    explain: "Merge Sort is a divide-and-conquer sorting algorithm that guarantees O(n log n) time complexity across all worst, best, and average cases."
  },
  {
    id: "tcat-cs-283",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "In a circular queue implemented using an array of size CAPACITY with indices front and rear, what condition indicates that the queue is full?",
    options: ["(rear + 1) % CAPACITY == front","rear == front","rear == CAPACITY - 1","front == (rear - 1) % CAPACITY"],
    correct: 0,
    explain: "In circular queue implementation with one slot reserved to distinguish full from empty, the queue is full when (rear + 1) % CAPACITY == front."
  },
  {
    id: "tcat-cs-284",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "What collision resolution technique in hash tables chains colliding key-value entries into a linked list at the same bucket index?",
    options: ["Separate Chaining","Linear Probing","Quadratic Probing","Double Hashing"],
    correct: 0,
    explain: "Separate Chaining maintains an auxiliary data structure (such as a linked list) at each array bucket to hold all colliding keys that hash to that index."
  },
  {
    id: "tcat-cs-285",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "What traversal of a Binary Search Tree (BST) visits nodes in non-decreasing (ascending) sorted order?",
    options: ["In-order traversal (Left, Root, Right)","Pre-order traversal (Root, Left, Right)","Post-order traversal (Left, Right, Root)","Level-order traversal"],
    correct: 0,
    explain: "In-order traversal visits the left subtree, then the current node, then the right subtree, producing strictly ascending sorted order for any valid BST."
  },
  {
    id: "tcat-cs-286",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Hard",
    q: "In an AVL Tree, what constitutes the valid balance factor range for every node in the tree?",
    options: ["{-1, 0, +1}","{0, 1, 2}","{-2, 0, +2}","Strictly 0"],
    correct: 0,
    explain: "An AVL tree maintains height balance such that for every node, Balance Factor = Height(Left Subtree) - Height(Right Subtree) ∈ {-1, 0, +1}."
  },
  {
    id: "tcat-cs-287",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Hard",
    q: "What is the worst-case time complexity of Quick Sort, and under what condition does it occur for standard Lomuto partitioning?",
    options: ["O(n^2), occurring when the chosen pivot is consistently the minimum or maximum element (e.g., already sorted array)","O(n log n), occurring when elements are in random order","O(n), occurring when all keys are identical","O(log n), occurring when the pivot splits the array into equal halves"],
    correct: 0,
    explain: "If the pivot divides the array into subproblems of size 0 and n - 1 (e.g., already sorted array with last element as pivot), recurrence T(n) = T(n-1) + O(n) yields O(n^2)."
  },
  {
    id: "tcat-cs-288",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Hard",
    q: "How does Floyd's Cycle Detection algorithm (Tortoise and Hare) determine if a linked list contains an internal loop?",
    options: ["Advances slow pointer by 1 step and fast pointer by 2 steps; if they meet, a cycle exists in O(n) time and O(1) auxiliary space","Stores every visited node address in an associative hash table","Reverses the linked list pointers and checks if the head is reached again","Counts the total number of nodes and checks if count exceeds 2^32"],
    correct: 0,
    explain: "Floyd's cycle-finding algorithm moves two pointers at different speeds (1 vs 2 steps). If a loop exists, the fast pointer laps and intersects the slow pointer in O(n) time with O(1) space."
  },
  {
    id: "tcat-cs-289",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Hard",
    q: "In a Binary Max-Heap represented as a 0-indexed array, what is the array index formula for the parent of a node located at index i (i > 0)?",
    options: ["(i - 1) / 2","i / 2","(i + 1) / 2","2 * i + 1"],
    correct: 0,
    explain: "In a 0-indexed binary heap array, the parent of index i is floor((i - 1) / 2), while its children are located at 2i + 1 (left) and 2i + 2 (right)."
  },
  {
    id: "tcat-cs-290",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Easy",
    q: "Which fundamental logic gate produces an output of 1 (HIGH) if and only if all of its input terminals are at logic 1?",
    options: ["AND gate","OR gate","NOT gate","XOR gate"],
    correct: 0,
    explain: "An AND gate evaluates the logical conjunction of inputs, yielding HIGH (1) strictly when every input is HIGH."
  },
  {
    id: "tcat-cs-291",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Easy",
    q: "According to Boolean algebra axioms, what does the expression A + 0 simplify to?",
    options: ["A","0","1","A'"],
    correct: 0,
    explain: "Under the Identity Law for logical OR addition, A + 0 = A."
  },
  {
    id: "tcat-cs-292",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Easy",
    q: "Which pair of logic gates are known as Universal Gates because any arbitrary Boolean function can be implemented using either gate alone?",
    options: ["NAND and NOR","AND and OR","XOR and XNOR","NOT and AND"],
    correct: 0,
    explain: "NAND and NOR are universal gates capable of synthesizing NOT, AND, OR, XOR, and all other combinational logic circuits."
  },
  {
    id: "tcat-cs-293",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Easy",
    q: "What is the output of a 2-input XOR gate when both inputs A and B are set to 1?",
    options: ["0","1","High impedance (Z)","Undefined"],
    correct: 0,
    explain: "An XOR gate outputs 1 only when inputs differ. When inputs are identical (A=1, B=1), XOR outputs 1 ⊕ 1 = 0."
  },
  {
    id: "tcat-cs-294",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Medium",
    q: "According to De Morgan's Laws, what is the equivalent dual form of the Boolean expression (A · B)'?",
    options: ["A' + B'","A' · B'","(A + B)'","A + B"],
    correct: 0,
    explain: "De Morgan's first theorem states that the complement of a product equals the sum of the individual complements: (A · B)' = A' + B'."
  },
  {
    id: "tcat-cs-295",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Medium",
    q: "Simplify the Boolean algebraic expression F = A + A'B using absorption/distribution theorems:",
    options: ["A + B","A · B","A' + B","B"],
    correct: 0,
    explain: "Using distributive law: A + A'B = (A + A')(A + B) = (1)(A + B) = A + B."
  },
  {
    id: "tcat-cs-296",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Medium",
    q: "What are the Boolean logic expressions for the Sum (S) and Carry (C) outputs of a Half Adder with inputs A and B?",
    options: ["S = A ⊕ B, C = A · B","S = A + B, C = A ⊕ B","S = A · B, C = A + B","S = (A ⊕ B)', C = A · B"],
    correct: 0,
    explain: "A half adder computes bit addition: Sum S = A ⊕ B (XOR), and Carry C = A · B (AND)."
  },
  {
    id: "tcat-cs-297",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Medium",
    q: "In Karnaugh Map (K-map) minimization, how are adjacent rows and columns arranged to ensure that only a single bit changes between adjacent cells?",
    options: ["Gray code sequence (00, 01, 11, 10)","Standard binary sequence (00, 01, 10, 11)","Hexadecimal progression","BCD coding"],
    correct: 0,
    explain: "K-map axes use Gray code ordering (00, 01, 11, 10) so that adjacent cells differ in exactly one variable, facilitating visual algebraic grouping."
  },
  {
    id: "tcat-cs-298",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Hard",
    q: "How many 2-to-1 Multiplexers (MUX) are required to construct a complete 8-to-1 Multiplexer tree?",
    options: ["7","8","4","3"],
    correct: 0,
    explain: "To build an 8-to-1 MUX using 2-to-1 MUXes: Stage 1 requires 4 MUXes, Stage 2 requires 2 MUXes, Stage 3 requires 1 MUX. Total = 4 + 2 + 1 = 7 MUXes."
  },
  {
    id: "tcat-cs-299",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Hard",
    q: "What is the characteristic equation of an edge-triggered J-K Flip-Flop denoting next state Q(t+1)?",
    options: ["Q(t+1) = J·Q' + K'·Q","Q(t+1) = J·Q + K·Q'","Q(t+1) = J'·Q + K·Q'","Q(t+1) = J ⊕ K ⊕ Q"],
    correct: 0,
    explain: "The characteristic equation for a J-K flip-flop derived from its truth table is Q(next) = J·Q' + K'·Q."
  },
  {
    id: "tcat-cs-300",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Hard",
    q: "In synchronous sequential circuits, what causes a race condition (static hazard) in combinational logic during input transitions?",
    options: ["Unequal propagation delays across convergent signal paths resulting in momentary spurious output glitches","Insufficient clock frequency from the quartz crystal oscillator","Excessive fan-out overloading gate voltage thresholds","Inversion of ground and supply voltages"],
    correct: 0,
    explain: "Static hazards occur when differential propagation delays along divergent physical paths cause a transient spike (glitch) before stabilizing to the steady-state Boolean value."
  },
  {
    id: "tcat-cs-301",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Hard",
    q: "Simplify the 4-variable minterm function F(A,B,C,D) = Σm(0, 2, 8, 10) into its minimal Sum-of-Products (SOP) form:",
    options: ["B'D'","A'C'","B'C'","A'D'"],
    correct: 0,
    explain: "Minterms in binary: m0 (0000), m2 (0010), m8 (1000), m10 (1010). A is 0 or 1, C is 0 or 1, while B is consistently 0 (B') and D is consistently 0 (D'). The four-corner grouping simplifies to B'D'."
  },
  {
    id: "tcat-cs-302",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Easy",
    q: "How many layers are formally defined in the International Organization for Standardization (ISO) OSI Reference Model?",
    options: ["7 layers","4 layers","5 layers","6 layers"],
    correct: 0,
    explain: "The OSI model defines 7 distinct layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application."
  },
  {
    id: "tcat-cs-303",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Easy",
    q: "What network topology connects all client nodes to a single centralized hardware switch or hub?",
    options: ["Star topology","Bus topology","Ring topology","Mesh topology"],
    correct: 0,
    explain: "In a Star topology, each network host features a dedicated point-to-point link directly to a central hub or switch."
  },
  {
    id: "tcat-cs-304",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Easy",
    q: "What protocol resolves human-readable domain names (e.g., www.example.com) into numerical IP addresses?",
    options: ["DNS (Domain Name System)","DHCP","FTP","SMTP"],
    correct: 0,
    explain: "DNS translates hierarchical host domain names into machine-routable numerical IP addresses."
  },
  {
    id: "tcat-cs-305",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Easy",
    q: "What is the length of an IPv4 address in bits versus an IPv6 address?",
    options: ["IPv4 is 32 bits, IPv6 is 128 bits","IPv4 is 16 bits, IPv6 is 64 bits","IPv4 is 64 bits, IPv6 is 256 bits","Both are 32 bits"],
    correct: 0,
    explain: "An IPv4 address consists of 32 bits (4 octets), whereas an IPv6 address consists of 128 bits (16 octets)."
  },
  {
    id: "tcat-cs-306",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Medium",
    q: "At which layer of the OSI model does an IP router primarily inspect packets and make forwarding decisions?",
    options: ["Layer 3 (Network Layer)","Layer 2 (Data Link Layer)","Layer 4 (Transport Layer)","Layer 7 (Application Layer)"],
    correct: 0,
    explain: "Routers operate at Layer 3 (Network Layer), inspecting logical IP headers and using routing tables to forward packets across subnets."
  },
  {
    id: "tcat-cs-307",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Medium",
    q: "What is the standard subnet mask for a default Class C IPv4 network address in dot-decimal notation?",
    options: ["255.255.255.0","255.0.0.0","255.255.0.0","255.255.255.255"],
    correct: 0,
    explain: "A default Class C network assigns 24 bits to the network prefix (/24), yielding the standard subnet mask 255.255.255.0."
  },
  {
    id: "tcat-cs-308",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Medium",
    q: "How does the Transmission Control Protocol (TCP) establish a reliable connection before transmitting application data?",
    options: ["Via a three-way handshake using SYN, SYN-ACK, and ACK control packets","By broadcasting UDP datagrams over the local Ethernet subnet","By requesting an IP lease from a local DHCP server","Via an ICMP echo request and echo reply ping sequence"],
    correct: 0,
    explain: "TCP initiates reliable sessions via the classic 3-way handshake: Client sends SYN, Server replies with SYN-ACK, and Client confirms with ACK."
  },
  {
    id: "tcat-cs-309",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Medium",
    q: "What protocol translates logical Layer 3 IP addresses into physical Layer 2 MAC hardware addresses on a local Ethernet subnet?",
    options: ["ARP (Address Resolution Protocol)","RARP","NAT","BGP"],
    correct: 0,
    explain: "ARP broadcasts a request onto the local network segment querying which host owns a target IP address, obtaining its 48-bit MAC address."
  },
  {
    id: "tcat-cs-310",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Hard",
    q: "In the IPv4 network 192.168.10.0/27, what is the maximum number of usable host IP addresses and what is the broadcast address?",
    options: ["30 usable hosts, broadcast address 192.168.10.31","32 usable hosts, broadcast address 192.168.10.32","14 usable hosts, broadcast address 192.168.10.15","62 usable hosts, broadcast address 192.168.10.63"],
    correct: 0,
    explain: "A /27 subnet leaves 32 - 27 = 5 host bits. Total addresses = 2^5 = 32 (indices 0 to 31). Subtracting network (0) and broadcast (31) leaves 32 - 2 = 30 usable hosts."
  },
  {
    id: "tcat-cs-311",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Hard",
    q: "How does TCP Reno handle network congestion when experiencing packet loss detected by three duplicate acknowledgments (triple-duplicate ACK)?",
    options: ["Halves the congestion window (ssthresh = cwnd / 2), sets cwnd to ssthresh + 3, and performs Fast Retransmit / Fast Recovery without dropping to slow-start","Resets cwnd to 1 MSS immediately and restarts slow-start","Doubles the congestion window exponentially","Terminates the TCP connection immediately"],
    correct: 0,
    explain: "Upon receiving 3 duplicate ACKs, TCP Reno executes Fast Retransmit and Fast Recovery: it halves cwnd, sets slow-start threshold ssthresh = cwnd / 2, and recovers without resetting to 1."
  },
  {
    id: "tcat-cs-312",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Hard",
    q: "What is the count-to-infinity problem in Distance Vector routing protocols (e.g., RIP), and what mechanism mitigates it?",
    options: ["Routing loops causing routing metrics to increment indefinitely; mitigated by Split Horizon and Poison Reverse techniques","Buffer overflows in switches; mitigated by CSMA/CD","Exhaustion of IPv4 addresses; mitigated by NAT","DNS query amplification; mitigated by DNSSEC"],
    correct: 0,
    explain: "In Distance Vector routing, link failure information propagates slowly, causing adjacent nodes to bounce metric updates until reaching infinity (16 in RIP); Split Horizon prevents advertising routes back."
  },
  {
    id: "tcat-cs-313",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Hard",
    q: "In symmetric vs asymmetric cryptography, how does the Diffie-Hellman Key Exchange protocol allow two parties to negotiate a secret session key over an insecure channel?",
    options: ["By exploiting the computational intractability of the discrete logarithm problem over finite cyclic groups without transmitting the secret exponents","By transmitting public keys encoded in plain text alongside private keys","By using symmetric block ciphers with pre-shared master passwords","By encrypting data through hash digests generated by MD5"],
    correct: 0,
    explain: "Diffie-Hellman relies on the difficulty of computing discrete logarithms in a finite field: Alice and Bob share g and p, compute g^a mod p and g^b mod p, and combine them into g^(ab) mod p without exposing secrets a or b."
  },
  {
    id: "tcat-cs-314",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Easy",
    q: "In relational database terminology, what is a single row in a table formally called?",
    options: ["Tuple (or Record)","Attribute","Domain","Schema"],
    correct: 0,
    explain: "In relational database theory, a row is formally referred to as a tuple (or record), while a column represents an attribute."
  },
  {
    id: "tcat-cs-315",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Easy",
    q: "Which SQL command is used to extract data rows from one or more database tables?",
    options: ["SELECT","UPDATE","INSERT","DROP"],
    correct: 0,
    explain: "The SQL SELECT statement queries and retrieves specified data records from database relations."
  },
  {
    id: "tcat-cs-316",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Easy",
    q: "What type of database key uniquely identifies each distinct record in a relational table and cannot contain NULL values?",
    options: ["Primary Key","Foreign Key","Secondary Key","Composite Key"],
    correct: 0,
    explain: "A Primary Key is a minimal candidate key that uniquely identifies each tuple in a table; entity integrity dictates it cannot be NULL."
  },
  {
    id: "tcat-cs-317",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Easy",
    q: "Which clause in an SQL SELECT query filters rows based on a specified boolean search condition?",
    options: ["WHERE","ORDER BY","GROUP BY","HAVING"],
    correct: 0,
    explain: "The WHERE clause specifies search predicates to filter tuples returned by an SQL query before aggregation."
  },
  {
    id: "tcat-cs-318",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Medium",
    q: "What constraint in relational database management ensures that a Foreign Key value must correspond to a valid Primary Key in the referenced parent table?",
    options: ["Referential Integrity","Entity Integrity","Domain Integrity","Check Constraint"],
    correct: 0,
    explain: "Referential integrity mandates that every non-null foreign key attribute must match an existing primary key value in the related target relation."
  },
  {
    id: "tcat-cs-319",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Medium",
    q: "What relational normalization requirement elevates a relational table from First Normal Form (1NF) to Second Normal Form (2NF)?",
    options: ["Elimination of all partial functional dependencies on any composite candidate key","Elimination of all transitive dependencies","Removal of repeating groups and ensuring atomic attribute values","Ensuring every determinant is a superkey"],
    correct: 0,
    explain: "Second Normal Form (2NF) requires 1NF plus the complete absence of partial functional dependencies (non-prime attributes must depend on the whole candidate key)."
  },
  {
    id: "tcat-cs-320",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Medium",
    q: "What is the key functional difference between the WHERE clause and the HAVING clause in an SQL query?",
    options: ["WHERE filters individual rows prior to grouping, while HAVING filters aggregated group results after GROUP BY","WHERE can only be used with numeric datatypes","HAVING is applied before table joins","Both clauses are completely interchangeable synonyms in standard SQL"],
    correct: 0,
    explain: "WHERE acts on individual tuples prior to aggregation; HAVING acts on grouped summaries produced by aggregate functions (COUNT, SUM, AVG) after GROUP BY."
  },
  {
    id: "tcat-cs-321",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Medium",
    q: "In the ACID properties of database transactions, what does the \"A\" (Atomicity) guarantee?",
    options: ["All operations within the transaction succeed completely, or the entire transaction is rolled back with zero modifications","Transactions execute in complete isolation from concurrent transactions","Committed data persists permanently even after power failure","Data strictly satisfies all integrity schema constraints"],
    correct: 0,
    explain: "Atomicity ensures that a transaction is an indivisible \"all-or-nothing\" unit of work: if any sub-operation fails, the entire transaction is aborted and rolled back."
  },
  {
    id: "tcat-cs-322",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Hard",
    q: "In relational algebra, what is the result of applying the natural join (⋈) between relations R(A, B) and S(B, C)?",
    options: ["A relation T(A, B, C) formed by equi-joining R and S on their common attribute B and projecting out duplicate B columns","The Cartesian product of R and S without any equality match","The union of rows present in R or S","The set difference containing tuples in R but not in S"],
    correct: 0,
    explain: "A natural join performs an equi-join on all identically named common attributes (here attribute B) and automatically eliminates the redundant duplicate column."
  },
  {
    id: "tcat-cs-323",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Hard",
    q: "What condition defines Boyce-Codd Normal Form (BCNF) strictly beyond Third Normal Form (3NF)?",
    options: ["For every non-trivial functional dependency X -> Y, the determinant X must be a superkey","Every attribute must be part of a candidate key","No multi-valued dependencies may exist in any relation","All join dependencies must be implied by candidate keys"],
    correct: 0,
    explain: "BCNF is a stricter version of 3NF: for every non-trivial functional dependency X -> Y, X must strictly be a superkey (eliminates candidate key overlaps)."
  },
  {
    id: "tcat-cs-324",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Hard",
    q: "In database indexing, why are B+ Trees preferred over standard Binary Search Trees for disk-based relational database indices?",
    options: ["High fan-out (branching factor) minimizes disk I/O seek operations, and leaf nodes are linked sequentially for efficient range scans","B+ Trees occupy zero memory in RAM","B+ Trees store full table records inside all interior routing nodes","B+ Trees eliminate the need for write-ahead logging"],
    correct: 0,
    explain: "B+ Trees have a high branching factor, keeping tree height low (typically 3-4 levels) to minimize costly disk block seeks, and their leaf chain allows rapid linear range scans."
  },
  {
    id: "tcat-cs-325",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Hard",
    q: "How does Strict Two-Phase Locking (Strict 2PL) prevent cascading transaction rollbacks (cascading aborts) in concurrent DBMS execution?",
    options: ["By holding all exclusive write locks until the transaction explicitly commits or aborts","By acquiring locks only after releasing previous shared locks","By executing all transactions in strict single-threaded serial order","By automatically converting write locks to shared locks during the shrinking phase"],
    correct: 0,
    explain: "Strict 2PL mandates that all exclusive (write) locks acquired during the growing phase must be retained until final commit or rollback, preventing other transactions from reading uncommitted dirty data."
  },
  {
    id: "tcat-cs-326",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Easy",
    q: "How many distinct states or values can be represented by an 8-bit unsigned byte?",
    options: ["256 (from 0 to 255)","128 (from 0 to 127)","512 (from 0 to 511)","1024 (from 0 to 1023)"],
    correct: 0,
    explain: "An n-bit binary sequence represents 2^n unique values. For 8 bits, 2^8 = 256 unique combinations, ranging from 0 to 255."
  },
  {
    id: "tcat-cs-327",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Easy",
    q: "What is the hexadecimal representation of the decimal integer 255?",
    options: ["0xFF","0xFE","0x100","0xFA"],
    correct: 0,
    explain: "255 in binary is 1111 1111_2. Each group of 4 bits corresponds to F in hexadecimal, yielding 0xFF."
  },
  {
    id: "tcat-cs-328",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Easy",
    q: "Which component of the Central Processing Unit directs the flow of signals and coordinates hardware operations according to program instructions?",
    options: ["Control Unit (CU)","Arithmetic Logic Unit (ALU)","Accumulator Register","L2 Cache"],
    correct: 0,
    explain: "The Control Unit fetches, decodes, and orchestrates the execution of instructions, routing control signals across the CPU datapath."
  },
  {
    id: "tcat-cs-329",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Easy",
    q: "Which computer storage medium retains its stored data even when external electric power is disconnected?",
    options: ["ROM (Read-Only Memory)","SRAM (Static RAM)","DRAM (Dynamic RAM)","CPU Register file"],
    correct: 0,
    explain: "ROM is non-volatile solid-state memory that preserves its firmware/bootloader instructions in the absence of power."
  },
  {
    id: "tcat-cs-330",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Easy",
    q: "What standard character encoding system originally utilized 7 bits to encode 128 characters including English letters and control codes?",
    options: ["ASCII","EBCDIC","UTF-16","Unicode 32"],
    correct: 0,
    explain: "Standard ASCII (American Standard Code for Information Interchange) uses 7 bits per character, supporting 2^7 = 128 codes."
  },
  {
    id: "tcat-cs-331",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Medium",
    q: "In two's complement binary arithmetic with an 8-bit signed integer representation, what is the binary code for decimal -1?",
    options: ["11111111","10000001","10000000","01111111"],
    correct: 0,
    explain: "+1 is 00000001. Inverting all bits gives 11111110; adding 1 yields 11111111, which equals -1 in two's complement."
  },
  {
    id: "tcat-cs-332",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Medium",
    q: "What is the principal operational distinction between Static RAM (SRAM) and Dynamic RAM (DRAM)?",
    options: ["SRAM utilizes flip-flop latches and requires no periodic refreshing, whereas DRAM utilizes capacitive charges requiring periodic refresh cycles","DRAM is significantly faster than SRAM","SRAM is non-volatile while DRAM is volatile","DRAM is utilized for L1 processor cache while SRAM is used for main memory"],
    correct: 0,
    explain: "SRAM stores bits using transistor flip-flops (faster, no refresh), while DRAM stores bits in tiny capacitors that leak charge and require periodic refreshing."
  },
  {
    id: "tcat-cs-333",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Medium",
    q: "During the instruction machine cycle, what specific hardware register holds the memory address of the next instruction to be fetched?",
    options: ["Program Counter (PC)","Instruction Register (IR)","Memory Buffer Register (MBR)","Status Flag Register"],
    correct: 0,
    explain: "The Program Counter (PC) stores the sequential memory address of the next instruction to be fetched from memory into the CPU."
  },
  {
    id: "tcat-cs-334",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Medium",
    q: "In the IEEE 754 single-precision (32-bit) floating-point format, how are the 32 bits allocated across sign, exponent, and fraction?",
    options: ["1 sign bit, 8 exponent bits, 23 fraction (mantissa) bits","1 sign bit, 11 exponent bits, 20 fraction bits","2 sign bits, 6 exponent bits, 24 fraction bits","1 sign bit, 7 exponent bits, 24 fraction bits"],
    correct: 0,
    explain: "IEEE 754 standard 32-bit float allocates bit 31 to sign, bits 30-23 (8 bits) to biased exponent, and bits 22-0 (23 bits) to mantissa/fraction."
  },
  {
    id: "tcat-cs-335",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "What structural feature fundamentally distinguishes Harvard computer architecture from von Neumann architecture?",
    options: ["Harvard architecture maintains physically segregated memory and bus pathways for instructions and data, preventing von Neumann bottlenecks","Von Neumann architecture uses separate instruction and data buses","Harvard architecture does not possess an ALU","Von Neumann architecture cannot execute conditional jumps"],
    correct: 0,
    explain: "Harvard architecture features separate address/data buses for instruction code and data memory, permitting simultaneous instruction fetching and data access."
  },
  {
    id: "tcat-cs-336",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "How does a direct-mapped cache determine whether a requested memory address results in a cache hit or cache miss?",
    options: ["Extracts the index bits to locate the cache line, then compares the address tag with the stored tag bit in that line alongside the valid bit","Searches all cache lines simultaneously using parallel associative comparisons","Performs a binary search through RAM","Executes a software interrupt to poll the BIOS"],
    correct: 0,
    explain: "In direct-mapped cache, the memory address is split into Tag, Index, and Offset. The index indexes the unique line, and if Valid==1 and Tag matches, a hit occurs."
  },
  {
    id: "tcat-cs-337",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "What is the purpose of the Translation Lookaside Buffer (TLB) in modern virtual memory management units (MMU)?",
    options: ["Acts as a high-speed hardware associative cache for recent virtual-to-physical page table address translations, mitigating page table walk latency","Buffers disk writes before committing to mechanical sectors","Translates source code directly into machine binary at runtime","Manages interrupt priorities between USB and Ethernet controllers"],
    correct: 0,
    explain: "The TLB caches recent virtual page number to physical frame number mappings, avoiding multi-level page table traversals in main memory on every memory access."
  },
  {
    id: "tcat-cs-338",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "In superscalar pipelined processors, how does out-of-order execution with Tomasulo's algorithm eliminate write-after-write (WAW) and write-after-read (WAR) false data hazards?",
    options: ["By register renaming using reservation stations and reorder buffers","By inserting stall bubbles until all previous instructions retire","By disabling multi-core hyperthreading completely","By flushing the entire instruction pipeline upon every branch"],
    correct: 0,
    explain: "Tomasulo's algorithm employs dynamic register renaming via reservation stations and tags, converting architectural registers to temporary tags to dissolve WAR and WAW false dependencies."
  },
  {
    id: "tcat-cs-339",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "In C++, which keyword is used to declare a variable whose value cannot be modified after initial assignment?",
    options: ["const","static","volatile","register"],
    correct: 0,
    explain: "The `const` qualifier enforces read-only immutability on a variable after initialization, causing compiler errors if modified."
  },
  {
    id: "tcat-cs-340",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "Which C++ header file must be included to use standard input and output streams like std::cin and std::cout?",
    options: ["<iostream>","<stdio.h>","<iomanip>","<fstream>"],
    correct: 0,
    explain: "<iostream> contains declarations for the standard basic I/O stream objects including cin, cout, cerr, and clog."
  },
  {
    id: "tcat-cs-341",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "Which loop construct in C++ is guaranteed to execute its block of code at least once before testing the loop termination condition?",
    options: ["do-while loop","while loop","for loop","nested for loop"],
    correct: 0,
    explain: "A `do-while` loop evaluates its condition at the bottom of the loop body, guaranteeing at least one execution."
  },
  {
    id: "tcat-cs-342",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "In C++, what operator is used to obtain the memory address of an existing variable?",
    options: ["& (address-of operator)","* (dereference operator)","-> (arrow operator)",":: (scope resolution)"],
    correct: 0,
    explain: "The unary ampersand `&` is the address-of operator, returning the memory address where the operand resides."
  },
  {
    id: "tcat-cs-343",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Medium",
    q: "What will be printed by the following C++ code snippet?\n`int x = 5;\nint y = ++x * 2;\ncout << y;`",
    options: ["12","10","11","14"],
    correct: 0,
    explain: "The prefix increment `++x` increments x from 5 to 6 before evaluation; then 6 * 2 = 12."
  },
  {
    id: "tcat-cs-344",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Medium",
    q: "In C++ Object-Oriented Programming, what mechanism enables a derived class to provide a specific implementation of a method declared in its base class?",
    options: ["Method overriding with virtual functions","Method overloading","Friend function scoping","Operator overloading"],
    correct: 0,
    explain: "Declaring a method as `virtual` in a base class allows a derived class to override it, enabling dynamic polymorphism via base class pointers."
  },
  {
    id: "tcat-cs-345",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Medium",
    q: "What happens when dynamic memory allocated with `new int[50]` in C++ is deallocated using `delete p` instead of `delete[] p`?",
    options: ["Undefined behavior and potential memory leaks or heap corruption occur","The compiler automatically detects it and frees the full array","A compile-time syntax error is thrown","Only the last element is deleted safely"],
    correct: 0,
    explain: "Mismatched deallocation (`delete` on an array allocated with `new[]`) results in undefined behavior and fails to invoke destructors on array elements."
  },
  {
    id: "tcat-cs-346",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Medium",
    q: "In C++, what is the difference between passing an argument by value versus passing by reference (`int& x`)?",
    options: ["Pass by value creates a local copy, whereas pass by reference allows direct modification of the original argument without copying","Pass by reference makes a deep copy of the variable","Pass by value is strictly faster for large user-defined structs","Pass by reference allocates new memory on the heap"],
    correct: 0,
    explain: "Pass-by-value duplicates data in the function frame; pass-by-reference binds an alias to the caller's object, avoiding copy overhead and allowing in-place edits."
  },
  {
    id: "tcat-cs-347",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Medium",
    q: "What is the function of a destructor in a C++ class, and how is it named?",
    options: ["Cleans up resources upon object destruction; named with a tilde followed by the class name (~ClassName)","Allocates dynamic memory; named with an exclamation mark (!ClassName)","Initializes member variables; named InitClassName()","Clones an object; named copyClassName()"],
    correct: 0,
    explain: "A destructor is invoked when an object goes out of scope or is deleted, releasing allocated resources; its identifier is `~ClassName()`."
  },
  {
    id: "tcat-cs-348",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Hard",
    q: "What is the purpose of the \"vptr\" and \"vtable\" in C++ implementations of runtime polymorphism?",
    options: ["The vtable is an array of function pointers per polymorphic class, and each object contains a vptr pointing to its class's vtable for dynamic dispatch","They manage garbage collection in heap memory","They convert virtual member functions into inline assembly","They prevent classes from being inherited by subclasses"],
    correct: 0,
    explain: "When virtual functions are used, the compiler generates a virtual method table (vtable) and injects a hidden pointer (vptr) in each object instance for late binding at runtime."
  },
  {
    id: "tcat-cs-349",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Hard",
    q: "What fundamental design principle does the RAII (Resource Acquisition Is Initialization) idiom embody in modern C++?",
    options: ["Resource lifetime is bound to the deterministic scope lifetime of stack-allocated objects whose destructors guarantee automatic resource release","All variables must be allocated dynamically using raw pointers","Constructors must never throw exceptions under any condition","Classes must always inherit from an abstract base interface"],
    correct: 0,
    explain: "RAII binds resource management (memory, file handles, mutex locks) to object lifetime, ensuring deterministic destruction and exception-safe cleanup when the stack frame unwinds."
  },
  {
    id: "tcat-cs-350",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Hard",
    q: "What distinguishes `std::unique_ptr` from `std::shared_ptr` in modern C++ smart pointer management?",
    options: ["unique_ptr maintains exclusive single ownership with zero reference counting overhead, whereas shared_ptr uses reference counting for shared ownership","unique_ptr allows multiple aliases while shared_ptr does not","shared_ptr cannot be used with custom deleters","unique_ptr stores objects on the stack while shared_ptr allocates them on disk"],
    correct: 0,
    explain: "`std::unique_ptr` owns and manages another object through a pointer and disposes of that object when the unique_ptr goes out of scope (move-only, non-copyable)."
  },
  {
    id: "tcat-cs-351",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Hard",
    q: "In C++, why must a base class have a `virtual` destructor if derived class objects are deleted through a base class pointer?",
    options: ["To ensure the derived class destructor is invoked, preventing memory leaks and incomplete object destruction","To allow the base class to be instantiated as an abstract class","To prevent the derived class from defining its own destructor","To speed up compile times during static linking"],
    correct: 0,
    explain: "Deleting a derived instance through a base pointer without a virtual destructor causes undefined behavior; the derived destructor is never invoked."
  },
  {
    id: "tcat-cs-352",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Easy",
    q: "Which linear data structure operates strictly on a Last-In, First-Out (LIFO) order of element retrieval?",
    options: ["Stack","Queue","Linked List","Binary Tree"],
    correct: 0,
    explain: "A stack follows the LIFO principle: the most recently pushed element is the first one popped."
  },
  {
    id: "tcat-cs-353",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Easy",
    q: "What is the time complexity of accessing an arbitrary element in a contiguous 1D array given its integer index?",
    options: ["O(1) constant time","O(n) linear time","O(log n) logarithmic time","O(n^2) quadratic time"],
    correct: 0,
    explain: "Array elements reside in contiguous memory; accessing index `i` is computed via `base_address + i * element_size` in O(1) time."
  },
  {
    id: "tcat-cs-354",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Easy",
    q: "Which data structure operates on a First-In, First-Out (FIFO) principle, where elements are enqueued at the rear and dequeued from the front?",
    options: ["Queue","Stack","Max-Heap","Graph"],
    correct: 0,
    explain: "A queue enforces First-In, First-Out (FIFO) ordering for processing items in chronological arrival order."
  },
  {
    id: "tcat-cs-355",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Easy",
    q: "What is the prerequisite condition for executing a Binary Search algorithm on a 1D array?",
    options: ["The array elements must be sorted","The array size must be a power of two","All elements must be positive integers","The array must be implemented as a linked list"],
    correct: 0,
    explain: "Binary search repeatedly divides the search interval in half, requiring that elements are sorted in monotonic order."
  },
  {
    id: "tcat-cs-356",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "What is the primary operational advantage of a singly linked list over a standard static array?",
    options: ["Dynamic size and efficient O(1) insertion/deletion at known node positions without shifting trailing elements","Constant-time random access to any element by index","Lower memory usage per element than arrays","Better cache spatial locality during sequential scans"],
    correct: 0,
    explain: "Linked lists allow nodes to be allocated dynamically anywhere in memory, permitting insertion/removal without reallocating or shifting neighboring data."
  },
  {
    id: "tcat-cs-357",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "In a complete binary tree containing n nodes, what is the theoretical maximum height (number of levels) of the tree?",
    options: ["O(log n)","O(n)","O(n log n)","O(1)"],
    correct: 0,
    explain: "Because a complete binary tree fills every level except possibly the last, its height is tightly bounded by floor(log2(n))."
  },
  {
    id: "tcat-cs-358",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "What is the average-case time complexity of the QuickSort algorithm when sorting an array of n distinct elements?",
    options: ["O(n log n)","O(n^2)","O(n)","O(log n)"],
    correct: 0,
    explain: "QuickSort divides the problem into balanced subproblems around a pivot on average, achieving an average runtime of O(n log n)."
  },
  {
    id: "tcat-cs-359",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "What tree traversal order visits nodes in the sequence: Left Subtree -> Root Node -> Right Subtree?",
    options: ["In-order traversal","Pre-order traversal","Post-order traversal","Breadth-first level traversal"],
    correct: 0,
    explain: "In-order traversal visits the left subtree, processes the root, and then visits the right subtree, producing sorted output in a Binary Search Tree."
  },
  {
    id: "tcat-cs-360",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Hard",
    q: "What self-balancing invariant must be satisfied by every node in an AVL tree to maintain O(log n) search time complexity?",
    options: ["The absolute difference between the heights of the left and right subtrees (balance factor) cannot exceed 1","Every node must be colored either red or black","The left child must always hold an even key and the right child an odd key","Every leaf node must reside at the exact same depth"],
    correct: 0,
    explain: "An AVL tree enforces that for every node, Balance Factor = |height(left) - height(right)| <= 1; any violation triggers tree rotations."
  },
  {
    id: "tcat-cs-361",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Hard",
    q: "How does open addressing with quadratic probing resolve hash collisions in a hash table?",
    options: ["Probes subsequent indices using a quadratic polynomial function of the attempt number: h(k, i) = (h(k) + c1*i + c2*i^2) mod m","Chains colliding keys into a linked list at the same bucket index","Discards the old key and overwrites it with the new key","Allocates a second separate hash table on disk"],
    correct: 0,
    explain: "Quadratic probing calculates probe locations via a quadratic function of the probe count i, reducing the primary clustering seen in linear probing."
  },
  {
    id: "tcat-cs-362",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Hard",
    q: "In a standard Min-Heap priority queue implemented via a 0-indexed array, what is the array index of the parent of a node located at index i (where i > 0)?",
    options: ["floor((i - 1) / 2)","floor(i / 2)","2 * i + 1","2 * i + 2"],
    correct: 0,
    explain: "For a 0-indexed binary heap array: parent(i) = floor((i - 1) / 2), left_child(i) = 2i + 1, and right_child(i) = 2i + 2."
  },
  {
    id: "tcat-cs-363",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Hard",
    q: "What is the worst-case time complexity of searching for a key in an unbalanced Binary Search Tree (BST) containing n nodes?",
    options: ["O(n)","O(log n)","O(1)","O(n log n)"],
    correct: 0,
    explain: "If keys are inserted in monotonic sorted order, an unbalanced BST degenerates into a linear linked list of height n, making search O(n)."
  },
  {
    id: "tcat-cs-364",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Hard",
    q: "How does Dijkstra's shortest-path algorithm efficiently select the next unvisited vertex with minimal tentative distance?",
    options: ["By utilizing a min-priority queue (min-heap) to extract the minimum distance vertex in O(log V) time","By performing a depth-first search across all possible graph paths","By computing the matrix inverse of the adjacency matrix","By sorting all graph edges globally using Kruskal's rule"],
    correct: 0,
    explain: "Using a min-heap allows Dijkstra's algorithm to extract the unvisited vertex with the smallest distance in O(log V), yielding O((V + E) log V) total time."
  },
  {
    id: "tcat-cs-365",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Easy",
    q: "Which two-input logic gate produces a HIGH (1) output ONLY when BOTH of its inputs are HIGH (1)?",
    options: ["AND gate","OR gate","XOR gate","NAND gate"],
    correct: 0,
    explain: "An AND gate outputs 1 if and only if all of its inputs are 1; otherwise its output is 0."
  },
  {
    id: "tcat-cs-366",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Easy",
    q: "What is the output of an inverter (NOT gate) when its digital input is 0?",
    options: ["1","0","High impedance (Z)","Undefined"],
    correct: 0,
    explain: "A NOT gate performs logical negation, inverting input 0 into output 1."
  },
  {
    id: "tcat-cs-367",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Easy",
    q: "According to Boolean algebra laws, what does the expression `A + 0` simplify to?",
    options: ["A","0","1","A'"],
    correct: 0,
    explain: "Under the Identity Law of Boolean OR operations, A + 0 = A."
  },
  {
    id: "tcat-cs-368",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Easy",
    q: "Which pair of logic gates are classified as \"Universal Gates\" because any Boolean logic circuit can be constructed solely from them?",
    options: ["NAND and NOR","AND and OR","XOR and XNOR","NOT and AND"],
    correct: 0,
    explain: "NAND and NOR gates are universal gates; any arbitrary combinational logic circuit can be synthesized using either gate alone."
  },
  {
    id: "tcat-cs-369",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Medium",
    q: "State De Morgan's First Theorem in Boolean algebra:",
    options: ["(A . B)' = A' + B'","(A + B)' = A' + B'","(A . B)' = A' . B'","(A + B)' = A . B"],
    correct: 0,
    explain: "De Morgan's theorem states that the complement of a product is equal to the sum of the complements: (A . B)' = A' + B'."
  },
  {
    id: "tcat-cs-370",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Medium",
    q: "What is the Boolean expression for the output of an Exclusive-OR (XOR) gate with inputs A and B?",
    options: ["A'B + AB'","AB + A'B'","A'B'","A + B"],
    correct: 0,
    explain: "The XOR function outputs 1 when the inputs differ, expressed in sum-of-products as A'B + AB'."
  },
  {
    id: "tcat-cs-371",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Medium",
    q: "Simplify the Boolean expression `A + A'B` using Boolean algebraic theorems:",
    options: ["A + B","A . B","A' + B","1"],
    correct: 0,
    explain: "By the absorption/distributive law: A + A'B = (A + A')(A + B) = (1)(A + B) = A + B."
  },
  {
    id: "tcat-cs-372",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Medium",
    q: "In digital arithmetic circuits, how many half-adders and OR gates are required to construct a single 1-bit Full-Adder?",
    options: ["Two half-adders and one OR gate","One half-adder and two OR gates","Three half-adders and zero OR gates","Four half-adders and one AND gate"],
    correct: 0,
    explain: "A full-adder sums three 1-bit inputs (A, B, Cin) using 2 half-adders and 1 OR gate to combine the carry-out signals."
  },
  {
    id: "tcat-cs-373",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Hard",
    q: "In a 4-variable Karnaugh Map (K-map), how many adjacent minterm cells must be grouped together to eliminate three Boolean variables from a product term?",
    options: ["8 cells","4 cells","2 cells","16 cells"],
    correct: 0,
    explain: "In a K-map, grouping 2^k adjacent cells eliminates k variables. To eliminate 3 variables, 2^3 = 8 cells (an octet) must be combined."
  },
  {
    id: "tcat-cs-374",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Hard",
    q: "What is the characteristic equation of an edge-triggered J-K Flip-Flop describing its next state Q(next)?",
    options: ["Q(next) = J Q' + K' Q","Q(next) = J Q + K Q'","Q(next) = J' Q + K Q","Q(next) = (J + K) Q"],
    correct: 0,
    explain: "The next-state equation for a J-K flip-flop is Q(next) = J Q' + K' Q. When J=K=1, Q(next) toggles to Q'."
  },
  {
    id: "tcat-cs-375",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Hard",
    q: "What operational feature distinguishes a Mealy finite state machine (FSM) from a Moore machine in sequential circuit design?",
    options: ["In a Mealy machine, outputs depend on both the current state and current inputs; in a Moore machine, outputs depend solely on the current state","In a Moore machine, outputs depend on both inputs and state","Mealy machines require no clock signal","Moore machines cannot be synthesized with flip-flops"],
    correct: 0,
    explain: "A Mealy machine's outputs are functions of current state AND primary inputs, often reacting a cycle faster than a Moore machine whose outputs depend solely on state."
  },
  {
    id: "tcat-cs-376",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Hard",
    q: "How does a Carry-Lookahead Adder (CLA) overcome the latency limitations of a standard ripple-carry adder?",
    options: ["Generates carry signals in parallel using Generate (G = A.B) and Propagate (P = A⊕B) logic functions, eliminating serial carry ripple delays","Uses software prediction to guess carry bits","Converts binary numbers into analog voltages","Discards the carry bit on all odd clock cycles"],
    correct: 0,
    explain: "CLA calculates carries ahead of time using Pi and Gi signals across all stages in O(1) logic depth, bypassing O(n) ripple propagation."
  },
  {
    id: "tcat-cs-377",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Easy",
    q: "What transmission medium uses pulses of light guided through thin silica glass fibers to achieve high-bandwidth data transmission?",
    options: ["Fiber optic cable","Shielded twisted pair (STP)","Coaxial cable","Unshielded twisted pair (UTP)"],
    correct: 0,
    explain: "Fiber optic cables transmit digital data signals as light pulses through core glass or plastic filaments using total internal reflection."
  },
  {
    id: "tcat-cs-378",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Easy",
    q: "Which networking topology connects all host nodes to a single central hub or switch via dedicated point-to-point links?",
    options: ["Star topology","Bus topology","Ring topology","Mesh topology"],
    correct: 0,
    explain: "In a star topology, each network device connects via a dedicated point-to-point link directly to a central multiport switch or hub."
  },
  {
    id: "tcat-cs-379",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Easy",
    q: "What network protocol dynamically translates human-readable domain names (e.g., www.google.com) into numerical IP addresses?",
    options: ["DNS (Domain Name System)","DHCP","FTP","SNMP"],
    correct: 0,
    explain: "DNS translates human-friendly domain names into machine-routable numerical IP addresses."
  },
  {
    id: "tcat-cs-380",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Easy",
    q: "What is the length of an IPv4 address in bits and how is it typically formatted?",
    options: ["32 bits formatted as 4 decimal octets separated by dots","128 bits formatted in hexadecimal","64 bits formatted as 8 octets","16 bits formatted in binary"],
    correct: 0,
    explain: "IPv4 addresses are 32-bit integers written in dotted-decimal notation as four 8-bit octets (e.g., 192.168.1.1)."
  },
  {
    id: "tcat-cs-381",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Medium",
    q: "What is the primary operational distinction between TCP (Transmission Control Protocol) and UDP (User Datagram Protocol)?",
    options: ["TCP is connection-oriented, reliable, and provides flow/congestion control; UDP is connectionless, lightweight, and does not guarantee packet delivery","UDP is connection-oriented while TCP is connectionless","TCP operates at the Network layer while UDP operates at the Transport layer","UDP encrypts all payload packets natively while TCP transmits plaintext"],
    correct: 0,
    explain: "TCP provides reliable, ordered, error-checked stream delivery with three-way handshaking; UDP is a lightweight, connectionless protocol with minimal overhead for real-time traffic."
  },
  {
    id: "tcat-cs-382",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Medium",
    q: "What protocol is responsible for mapping a known Network Layer IP address to a physical Data Link Layer MAC address on a local area network?",
    options: ["ARP (Address Resolution Protocol)","RARP","ICMP","IGMP"],
    correct: 0,
    explain: "ARP broadcasts on the local subnet to resolve a known logical IP address into the physical hardware MAC address of the destination interface."
  },
  {
    id: "tcat-cs-383",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Medium",
    q: "In classless inter-domain routing (CIDR) notation, how many usable host IP addresses are available on a `/26` subnet?",
    options: ["62 usable hosts","64 usable hosts","30 usable hosts","126 usable hosts"],
    correct: 0,
    explain: "A /26 subnet has 32 - 26 = 6 host bits. Total addresses = 2^6 = 64. Subtracting 2 (network and broadcast addresses) leaves 62 usable host addresses."
  },
  {
    id: "tcat-cs-384",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Medium",
    q: "At which layer of the OSI model do network routers primarily operate to inspect packet headers and make forwarding decisions?",
    options: ["Network Layer (Layer 3)","Data Link Layer (Layer 2)","Transport Layer (Layer 4)","Physical Layer (Layer 1)"],
    correct: 0,
    explain: "Routers operate at Layer 3 (Network Layer), inspecting destination IP addresses to route packets across disparate networks."
  },
  {
    id: "tcat-cs-385",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Hard",
    q: "What is the sequence of flag packets exchanged during the standard TCP Three-Way Handshake to establish a connection?",
    options: ["SYN -> SYN-ACK -> ACK","ACK -> SYN -> SYN-ACK","SYN -> ACK -> FIN","DATA -> ACK -> PSH"],
    correct: 0,
    explain: "TCP connection establishment: Client sends SYN, Server replies with SYN-ACK, and Client completes connection with ACK."
  },
  {
    id: "tcat-cs-386",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Hard",
    q: "How does the TCP congestion control mechanism respond to packet loss detected via three duplicate ACKs under TCP Reno?",
    options: ["Executes Fast Retransmit, cuts Congestion Window (cwnd) in half, and enters Fast Recovery without resetting cwnd to 1 MSS","Resets cwnd immediately to 1 MSS and restarts Slow Start","Increases cwnd exponentially to saturate the buffer","Closes the socket connection immediately"],
    correct: 0,
    explain: "Three duplicate ACKs trigger Fast Retransmit and Fast Recovery: cwnd is halved (ssthresh = cwnd / 2), avoiding the drastic reset to 1 MSS seen on timeout."
  },
  {
    id: "tcat-cs-387",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Hard",
    q: "What routing metric and algorithm are employed by the Open Shortest Path First (OSPF) routing protocol?",
    options: ["Dijkstra's shortest path algorithm operating on link-state cost metrics based on interface bandwidth","Bellman-Ford algorithm operating on hop count","Spanning Tree Protocol operating on MAC addresses","Flooding with random walks"],
    correct: 0,
    explain: "OSPF is an Interior Gateway link-state protocol that builds a complete network topology map and executes Dijkstra's SPF algorithm using interface bandwidth cost."
  },
  {
    id: "tcat-cs-388",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Hard",
    q: "In asymmetric public-key cryptography (e.g., RSA), which key is used to encrypt a message so that only the designated recipient can decrypt it?",
    options: ["The recipient's public key is used to encrypt, and the recipient's private key decrypts","The sender's private key encrypts, and recipient's public key decrypts","The sender's public key encrypts, and recipient's private key decrypts","A shared symmetric session key generated by the ISP"],
    correct: 0,
    explain: "Confidentiality in public key cryptography: Sender encrypts with Recipient's Public Key; only the Recipient's private key can invert the trapdoor permutation to decrypt."
  },
  {
    id: "tcat-cs-389",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Easy",
    q: "What type of database key uniquely identifies each record/tuple in a relational database table and cannot contain null values?",
    options: ["Primary Key","Foreign Key","Composite Secondary Key","Surrogate Foreign Key"],
    correct: 0,
    explain: "A Primary Key is a minimal candidate key selected to uniquely identify each row in a relation; entity integrity mandates it cannot be NULL."
  },
  {
    id: "tcat-cs-390",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Easy",
    q: "Which standard SQL command is used to retrieve data from one or more database tables?",
    options: ["SELECT","EXTRACT","GET","RETRIEVE"],
    correct: 0,
    explain: "The `SELECT` statement is the fundamental DML query command in SQL used to fetch rows and columns from tables."
  },
  {
    id: "tcat-cs-391",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Easy",
    q: "What type of key establishes a relational link between two database tables by referencing the primary key of another table?",
    options: ["Foreign Key","Primary Key","Super Key","Natural Key"],
    correct: 0,
    explain: "A Foreign Key is a field in one table that refers to the Primary Key in another table, enforcing referential integrity."
  },
  {
    id: "tcat-cs-392",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Easy",
    q: "Which SQL clause is used to filter query results based on specific conditional criteria?",
    options: ["WHERE","ORDER BY","GROUP BY","HAVING"],
    correct: 0,
    explain: "The `WHERE` clause filters rows before aggregation, returning only records that satisfy the specified condition."
  },
  {
    id: "tcat-cs-393",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Medium",
    q: "What is the primary goal of Database Normalization in relational database design?",
    options: ["Eliminate data redundancy and prevent update, insertion, and deletion anomalies","Maximize disk space utilization by compressing strings","Combine all application tables into a single large flat file","Automatically create clustered B-tree indexes for all attributes"],
    correct: 0,
    explain: "Normalization decomposes relations to minimize data duplication, prevent update/insert/delete anomalies, and ensure data integrity."
  },
  {
    id: "tcat-cs-394",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Medium",
    q: "A relational table is in First Normal Form (1NF) if and only if:",
    options: ["All attributes contain only atomic (indivisible) scalar values and there are no repeating groups","Every non-key attribute is fully functionally dependent on the primary key","It contains no transitive dependencies","It has no foreign key references"],
    correct: 0,
    explain: "1NF mandates that each column contains only atomic values and there are no multivalued attributes or repeating groups."
  },
  {
    id: "tcat-cs-395",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Medium",
    q: "What is the operational difference between the SQL `WHERE` clause and the `HAVING` clause?",
    options: ["WHERE filters individual rows prior to grouping, whereas HAVING filters aggregated groups after GROUP BY","HAVING filters individual rows prior to grouping","WHERE can only be used with numeric data types","HAVING cannot be used alongside GROUP BY"],
    correct: 0,
    explain: "`WHERE` applies row-level filters before aggregation; `HAVING` applies filtering conditions to group summaries produced by `GROUP BY`."
  },
  {
    id: "tcat-cs-396",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Medium",
    q: "What type of SQL JOIN returns all matching rows from both tables, plus all unmatched rows from the left table with NULLs filled in for right table attributes?",
    options: ["LEFT OUTER JOIN","INNER JOIN","RIGHT OUTER JOIN","CROSS JOIN"],
    correct: 0,
    explain: "A `LEFT OUTER JOIN` retains all tuples from the left relation, matching them with right table tuples where the predicate holds or outputting NULLs where no match exists."
  },
  {
    id: "tcat-cs-397",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Hard",
    q: "In the ACID transaction properties of database management systems, what does \"Isolation\" guarantee?",
    options: ["Concurrent execution of transactions results in a system state that would be obtained if transactions were executed serially","All or none of the operations in a transaction are committed","Database integrity constraints are never violated","Committed updates survive power outages and system crashes"],
    correct: 0,
    explain: "Isolation ensures that concurrently running transactions cannot see or interfere with each other's intermediate uncommitted states (serializability)."
  },
  {
    id: "tcat-cs-398",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Hard",
    q: "What condition defines Third Normal Form (3NF) for a relation already conforming to 2NF?",
    options: ["Every non-prime attribute is non-transitively dependent on every candidate key (no non-key determines another non-key)","Every determinant is a candidate key (BCNF condition)","No multi-valued dependencies exist","No partial functional dependencies exist on a composite key"],
    correct: 0,
    explain: "3NF requires that the relation is in 2NF and contains no transitive dependencies: for every non-trivial functional dependency X -> Y, either X is a superkey or Y is a prime attribute."
  },
  {
    id: "tcat-cs-399",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Hard",
    q: "How does Two-Phase Locking (2PL) guarantee conflict serializability in database concurrency control?",
    options: ["Transactions must acquire all needed locks during an expanding Growing Phase and may not acquire new locks once any lock is released in the Shrinking Phase","Locks are acquired and released randomly based on CPU availability","Transactions never lock rows, relying entirely on timestamps","Write locks are converted into read locks after every commit"],
    correct: 0,
    explain: "Under 2PL, a transaction cannot request any lock once it has released any lock (Phase 1: Growing/acquiring; Phase 2: Shrinking/releasing), mathematically guaranteeing conflict serializability."
  },
  {
    id: "tcat-cs-400",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Hard",
    q: "What structural property makes a B+ Tree index superior to a standard binary search tree for relational database index storage on block storage devices?",
    options: ["High fan-out yields a shallow tree depth, minimizing disk I/O, and leaf nodes are linked sequentially for efficient range scans","Binary search trees have higher branching factors","B+ trees store all data records in internal nodes","B+ trees do not require any memory buffering"],
    correct: 0,
    explain: "B+ trees have high branching factor (fanout of hundreds), meaning height is typically 3-4, requiring few disk seeks. Leaves form a linked list, enabling fast sequential range queries."
  },
  {
    id: "tcat-cs-401",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Easy",
    q: "Which component of the Central Processing Unit (CPU) coordinates and synchronizes all hardware operations via control signals?",
    options: [
      "Control Unit (CU)",
      "Arithmetic Logic Unit (ALU)",
      "Accumulator Register",
      "Program Status Word"
    ],
    correct: 0,
    explain: "The Control Unit (CU) directs system operations by decoding instructions and generating control timing signals to the ALU, registers, and memory bus."
  },
  {
    id: "tcat-cs-402",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "What is the 8-bit two's complement binary representation of the negative decimal integer -43?",
    options: [
      "11010101",
      "11010100",
      "10101011",
      "11101011"
    ],
    correct: 0,
    explain: "+43 in 8-bit binary is 00101011. One's complement (invert bits) is 11010100. Adding 1 gives the two's complement: 11010101."
  },
  {
    id: "tcat-cs-403",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Medium",
    q: "In the memory hierarchy, which type of semiconductor memory provides the fastest access latency for the processor core?",
    options: [
      "L1 CPU Cache (SRAM)",
      "Main System RAM (DRAM)",
      "Solid State Drive (NAND Flash)",
      "Optical Disc (Blu-ray)"
    ],
    correct: 0,
    explain: "L1 CPU Cache implemented with static RAM (SRAM) integrated directly onto the processor die exhibits single-cycle access latency (~1 ns)."
  },
  {
    id: "tcat-cs-404",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Medium",
    q: "What is the primary function of the Program Counter (PC) register in von Neumann architecture?",
    options: [
      "To hold the memory address of the next instruction to be fetched and executed",
      "To store the mathematical output of the ALU",
      "To buffer data read directly from secondary storage",
      "To count the total number of instructions executed since boot"
    ],
    correct: 0,
    explain: "The Program Counter (PC) register stores the memory address of the upcoming instruction in the instruction fetch-decode-execute cycle."
  },
  {
    id: "tcat-cs-405",
    subject: "Computer Science",
    topic: "Computer Fundamentals",
    difficulty: "Hard",
    q: "Which hardware mechanism allows high-speed peripheral input/output controllers to transfer data blocks directly to and from main RAM without continuous CPU intervention?",
    options: [
      "Direct Memory Access (DMA)",
      "Programmed I/O polling",
      "Interrupt-driven accumulation",
      "Bus arbitration snooping"
    ],
    correct: 0,
    explain: "DMA bypasses the CPU for bulk memory transfers, allowing disk and network controllers to read or write RAM directly, freeing CPU cycles."
  },
  {
    id: "tcat-cs-406",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "In C/C++, what is the value stored in variable x after executing: int x = 17 % 5; ?",
    options: [
      "2",
      "3",
      "3.4",
      "1"
    ],
    correct: 0,
    explain: "The modulus operator (%) computes the integer remainder of division: 17 = 3 * 5 + 2, so 17 % 5 = 2."
  },
  {
    id: "tcat-cs-407",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Easy",
    q: "Which iterative loop construct is guaranteed to execute its code block at least once regardless of whether the loop condition initially evaluates to true or false?",
    options: [
      "do-while loop",
      "while loop",
      "for loop",
      "nested loop"
    ],
    correct: 0,
    explain: "A do-while loop evaluates its exit test condition at the end of the iteration, guaranteeing at least one execution pass."
  },
  {
    id: "tcat-cs-408",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Medium",
    q: "Consider the recursive C function: int f(int n) { if(n <= 1) return 1; return n * f(n - 1); }. What does this function compute for any positive integer n?",
    options: [
      "Factorial of n (n!)",
      "Fibonacci number F_n",
      "Sum of integers up to n",
      "Power 2^n"
    ],
    correct: 0,
    explain: "The recurrence relation f(n) = n * f(n - 1) with base case f(1) = 1 defines the factorial mathematical function n!."
  },
  {
    id: "tcat-cs-409",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Medium",
    q: "What occurs when a recursive function lacks a well-defined terminating base case or the base condition is unreachable?",
    options: [
      "Call stack overflow error (StackOverflowException)",
      "Heap memory leakage error",
      "Syntax compilation error",
      "Segmentation fault during lexical scanning"
    ],
    correct: 0,
    explain: "Unbounded recursion continuously pushes activation stack frames onto the thread runtime call stack until memory is exhausted, throwing a Stack Overflow."
  },
  {
    id: "tcat-cs-410",
    subject: "Computer Science",
    topic: "Programming Fundamentals",
    difficulty: "Hard",
    q: "What is the runtime output in C when dereferencing an uninitialized dangling pointer pointing to deallocated memory?",
    options: [
      "Undefined behavior (potential segmentation fault or memory corruption)",
      "Deterministic compile-time syntax error",
      "Safe initialization to integer value 0",
      "Automatic garbage collection reallocation"
    ],
    correct: 0,
    explain: "Dereferencing a dangling or uninitialized pointer accesses invalid address space, causing undefined behavior or an immediate SIGSEGV signal."
  },
  {
    id: "tcat-cs-411",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Easy",
    q: "Which abstract data structure operates strictly under the Last-In, First-Out (LIFO) access discipline?",
    options: [
      "Stack",
      "Queue",
      "Array",
      "Linked List"
    ],
    correct: 0,
    explain: "A stack restricts insertion and deletion to one end (the top), adhering strictly to Last-In, First-Out (LIFO)."
  },
  {
    id: "tcat-cs-412",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "What is the worst-case time complexity of binary search when executed on a sorted array containing n elements?",
    options: [
      "O(log n)",
      "O(n)",
      "O(n log n)",
      "O(1)"
    ],
    correct: 0,
    explain: "Binary search halves the search interval in every iteration, executing in O(log n) comparisons in both average and worst cases."
  },
  {
    id: "tcat-cs-413",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Medium",
    q: "What is the primary advantage of a singly linked list over a contiguous static array?",
    options: [
      "Dynamic size with O(1) constant-time insertion at the head without reallocation",
      "Instantaneous O(1) random index access to arbitrary elements",
      "Zero auxiliary memory overhead for pointer metadata",
      "Superior hardware CPU cache locality during sequential scans"
    ],
    correct: 0,
    explain: "Linked lists allow nodes to be allocated dynamically anywhere in heap memory, enabling O(1) insertion at the front without shifting elements."
  },
  {
    id: "tcat-cs-414",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Hard",
    q: "In a complete binary max-heap implemented as an array where the root is at index 0, what is the array index of the left child of a node stored at index i?",
    options: [
      "2*i + 1",
      "2*i + 2",
      "2*i",
      "(i - 1) / 2"
    ],
    correct: 0,
    explain: "For zero-based array representation of a binary heap, the left child of node i is at 2*i + 1, and the right child is at 2*i + 2."
  },
  {
    id: "tcat-cs-415",
    subject: "Computer Science",
    topic: "Data Structures Basics",
    difficulty: "Hard",
    q: "What is the average-case and worst-case time complexity of standard Quicksort algorithm using a naive fixed pivot strategy?",
    options: [
      "Average O(n log n), Worst-case O(n^2)",
      "Average O(n), Worst-case O(n log n)",
      "Average O(n log n), Worst-case O(n log n)",
      "Average O(n^2), Worst-case O(n^3)"
    ],
    correct: 0,
    explain: "Quicksort divides elements around a pivot; balanced partitions yield O(n log n) average time, but already sorted data with a fixed endpoint pivot degrades to O(n^2)."
  },
  {
    id: "tcat-cs-416",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Easy",
    q: "Which basic digital logic gate outputs logic 1 (HIGH) if and only if all of its input terminals are at logic 1?",
    options: [
      "AND gate",
      "OR gate",
      "XOR gate",
      "NAND gate"
    ],
    correct: 0,
    explain: "An AND gate produces a HIGH output solely when every input is asserted HIGH (1)."
  },
  {
    id: "tcat-cs-417",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Easy",
    q: "According to Boolean algebra laws, what is the simplified form of the expression A + A'*B ?",
    options: [
      "A + B",
      "A * B",
      "A' + B",
      "A"
    ],
    correct: 0,
    explain: "By the absorption/redundancy law: A + A'*B = (A + A')(A + B) = (1)(A + B) = A + B."
  },
  {
    id: "tcat-cs-418",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Medium",
    q: "According to De Morgan's second theorem, the complement of a sum of variables (A + B)' is algebraically equivalent to:",
    options: [
      "A' * B'",
      "A' + B'",
      "(A * B)'",
      "A + B'"
    ],
    correct: 0,
    explain: "De Morgan's Law states that the NOR operation is dual to AND with inverted inputs: (A + B)' = A' * B'."
  },
  {
    id: "tcat-cs-419",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Medium",
    q: "Which two logic gates are classified as \"Universal Gates\" because any Boolean logic circuit can be synthesized exclusively using either one?",
    options: [
      "NAND and NOR",
      "AND and OR",
      "XOR and XNOR",
      "NOT and AND"
    ],
    correct: 0,
    explain: "NAND and NOR are universal gates capable of implementing NOT, AND, OR, XOR, and all combinational logic functions without other gate types."
  },
  {
    id: "tcat-cs-420",
    subject: "Computer Science",
    topic: "Boolean Algebra & Logic Gates",
    difficulty: "Hard",
    q: "How many 2-to-1 multiplexers (MUX) are required to construct a 4-to-1 multiplexer circuit?",
    options: [
      "3",
      "2",
      "4",
      "5"
    ],
    correct: 0,
    explain: "Two 2-to-1 MUXes select between four inputs in the first stage using select line s0, and one 2-to-1 MUX in the second stage selects between their outputs using select line s1, requiring 3 total."
  },
  {
    id: "tcat-cs-421",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Easy",
    q: "What is the length in bits of a standard IPv4 network address?",
    options: [
      "32 bits",
      "64 bits",
      "128 bits",
      "16 bits"
    ],
    correct: 0,
    explain: "IPv4 addresses are 32 bits long (4 octets), whereas IPv6 addresses are 128 bits in length."
  },
  {
    id: "tcat-cs-422",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Easy",
    q: "Which protocol translates human-readable domain names (such as uettaxila.edu.pk) into numerical IP addresses?",
    options: [
      "Domain Name System (DNS)",
      "Dynamic Host Configuration Protocol (DHCP)",
      "Simple Mail Transfer Protocol (SMTP)",
      "File Transfer Protocol (FTP)"
    ],
    correct: 0,
    explain: "DNS (Domain Name System) operates as the Internet's directory, resolving alphanumeric domain names into IP addresses."
  },
  {
    id: "tcat-cs-423",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Medium",
    q: "At which layer of the OSI 7-layer reference model do network routers operate to determine optimal packet forwarding paths?",
    options: [
      "Network Layer (Layer 3)",
      "Data Link Layer (Layer 2)",
      "Transport Layer (Layer 4)",
      "Physical Layer (Layer 1)"
    ],
    correct: 0,
    explain: "Routers operate at the Network Layer (Layer 3), using logical IP addressing and routing protocols to route packets across subnets."
  },
  {
    id: "tcat-cs-424",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Hard",
    q: "Which transmission protocol guarantees reliable, ordered, and error-checked delivery of a stream of octets between networked applications?",
    options: [
      "Transmission Control Protocol (TCP)",
      "User Datagram Protocol (UDP)",
      "Internet Control Message Protocol (ICMP)",
      "Address Resolution Protocol (ARP)"
    ],
    correct: 0,
    explain: "TCP establishes connection-oriented sessions with three-way handshakes, sequence tracking, acknowledgments, and retransmissions, ensuring reliable delivery."
  },
  {
    id: "tcat-cs-425",
    subject: "Computer Science",
    topic: "Computer Networks & Internet",
    difficulty: "Hard",
    q: "In the TCP three-way handshake connection establishment, what is the exact sequence of control flag packets transmitted between client and server?",
    options: [
      "SYN, SYN-ACK, ACK",
      "SYN, ACK, FIN",
      "ACK, SYN-ACK, SYN",
      "RST, SYN, ACK"
    ],
    correct: 0,
    explain: "TCP initiates connection by client sending SYN, server responding with SYN-ACK, and client concluding setup with ACK."
  },
  {
    id: "tcat-cs-426",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Easy",
    q: "Which SQL statement is used to retrieve data records from a relational database table?",
    options: [
      "SELECT",
      "EXTRACT",
      "GET",
      "RETRIEVE"
    ],
    correct: 0,
    explain: "The SQL SELECT statement queries and retrieves specified columns or rows from database tables."
  },
  {
    id: "tcat-cs-427",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Easy",
    q: "An attribute or minimal set of attributes that uniquely identifies every tuple (record) within a relational table is called the:",
    options: [
      "Primary Key",
      "Foreign Key",
      "Composite Index",
      "Surrogate Pointer"
    ],
    correct: 0,
    explain: "A primary key uniquely identifies each entity instance or tuple in a relation, enforcing entity integrity (no nulls and no duplicate keys)."
  },
  {
    id: "tcat-cs-428",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Hard",
    q: "In relational database theory, Second Normal Form (2NF) mandates that the table is in 1NF and that:",
    options: [
      "Every non-key attribute is fully functionally dependent on the entire primary key (no partial dependencies)",
      "There are no transitive dependencies between non-key attributes",
      "All attributes contain multi-valued repeating groups",
      "Foreign keys must reference unique candidate keys in different databases"
    ],
    correct: 0,
    explain: "2NF eliminates partial functional dependencies; every non-prime attribute must depend on the whole candidate key, not a proper subset."
  },
  {
    id: "tcat-cs-429",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Medium",
    q: "What is the function of a FOREIGN KEY constraint in a relational database management system?",
    options: [
      "To enforce referential integrity between two associated tables",
      "To accelerate indexing of non-unique strings",
      "To prevent the table from exceeding physical disk storage limits",
      "To automatically encrypt sensitive biometric data"
    ],
    correct: 0,
    explain: "A foreign key references the primary key of another table, ensuring referential integrity by preventing orphaned rows and invalid cross-references."
  },
  {
    id: "tcat-cs-430",
    subject: "Computer Science",
    topic: "Database Basics",
    difficulty: "Hard",
    q: "In the ACID transaction processing model, which property ensures that once a database transaction commits, its state changes survive system crashes or power failures?",
    options: [
      "Durability",
      "Atomicity",
      "Consistency",
      "Isolation"
    ],
    correct: 0,
    explain: "Durability guarantees that committed transaction modifications are recorded permanently in non-volatile write-ahead logging storage and persist across system failures."
  }
];

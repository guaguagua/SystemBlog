---
title: RISC-V MCU 固件：日志、命令行与测试仿真常用库
category: 嵌入式固件
summary: 面向裸机、无 RTOS 的小型 RISC-V MCU，用表格汇总日志调试、命令行、协程、host 通信和测试仿真常用的库与工具。
date: 2026-10-10
---

# RISC-V MCU 固件：日志、命令行与测试仿真常用库

小型 RISC-V MCU 固件通常裸机运行、不跑 RTOS，外设很少，有时连 UART 都没有，主要负责上电初始化、校准和流程控制。这类固件最需要解决两个问题：**日志怎么打**，以及**硬件就绪之前怎么测试**。

## 日志与调试

| 库 / 工具 | 作用 | 备注 |
|---|---|---|
| [Trice](https://github.com/rokath/trice) | 延迟格式化日志：固件只记录消息 ID 和参数，PC 端还原成文字 | 省掉格式字符串和 printf 实现，执行快，对实时时序影响小；不使用动态内存 |
| [lwrb](https://github.com/MaJerle/lwrb) | 轻量环形缓冲区 | 日志缓冲、mailbox 收发都能用；缓冲区由使用者传入，不使用动态内存 |
| [eyalroz/printf](https://github.com/eyalroz/printf) | 小体积 printf 实现 | 有 UART 时使用，建议只在调试版本打开；不使用动态内存 |
| 自制延迟日志 | RAM 环形缓冲 + PC 解码脚本 | 约一百行代码，host 可通过 APB/mailbox/JTAG 读取 |

## 命令行（shell）

在固件里提供一个交互式命令行，用来现场读写寄存器、触发某一步流程。只需要提供"读一个字符、写一个字符"两个函数，没有 UART 时可以接到 RAM 缓冲，由 host 通过 mailbox 或调试接口收发。

| 库 | 作用 | 备注 |
|---|---|---|
| [letter-shell](https://github.com/NevermindZZT/letter-shell) | 功能较全的嵌入式 shell，支持命令导出、历史记录、补全 | 核心不使用动态内存，缓冲区由使用者传入；`SHELL_MALLOC` / `SHELL_FREE` 只在开启数组参数支持时需要；不依赖 RTOS，可在裸机主循环中运行 |
| [embedded-cli](https://github.com/funbiscuit/embedded-cli) | 单头文件命令行，支持历史记录、补全 | 配置里的 `cliBuffer` 为 NULL 时用 `malloc`，提供静态缓冲区则不使用动态内存 |
| [microrl](https://github.com/Helius/microrl) | 轻量 readline 风格行编辑 | 不使用动态内存（源码中无 `malloc`/`free`）；历史记录为静态环形缓冲，依赖标准 C 库 |
| [nr_micro_shell](https://github.com/Nrusher/nr_micro_shell) | 小体积 shell | 不使用动态内存（源码中无 `malloc`/`free`）；命令长度、参数个数、历史条数均为固定值，依赖基础 libc |

选用时用 `-nostdlib` 构建：如果库里有 `malloc` 调用，链接阶段会直接报错。

## 协程

上电初始化、校准这类流程基本都是"写寄存器 → 等完成 → 下一步"，用无栈协程可以写成顺序代码，在裸机主循环里轮流调用。以下几种都只是头文件里的宏，与指令集无关，每个协程只占几个字节状态。

| 库 | 作用 | 备注 |
|---|---|---|
| [protothreads](https://dunkels.com/adam/pt/) | 无栈协程，原版 `pt.h` | 不使用动态内存；跨 yield 的局部变量要改成 `static`，协程内不能用 `switch` |
| [zserge/pt](https://github.com/zserge/pt) | 无栈协程，单头文件约 180 行 | 不使用动态内存；可用 GCC `&&label` 保存位置，协程内可以写 `switch`；附带定长消息队列 |
| [async.h](https://github.com/naasking/async.h) | async/await 风格的无栈协程 | 不使用动态内存；状态 2 字节；局部变量放进状态结构体，`async_call` 可等待另一个异步函数 |
| [coroutine.h](https://www.chiark.greenend.org.uk/~sgtatham/coroutines.html)（Simon Tatham） | 最简协程宏，十几行 | 不使用动态内存；适合理解原理后自己写一份 |

## host 通信

host 和 MCU 之间一般通过 mailbox 寄存器或一小块共享 RAM 通信，配合 **doorbell**：发送方先把命令号和参数写进 mailbox，最后写一个专门的 doorbell 寄存器（通常会触发对方中断，或置一个对方轮询的标志位），表示"消息已写完，可以读了"；接收方处理完后回写状态，再敲对方的 doorbell 或清除标志作为应答。doorbell 本身就划定了消息边界，所以 mailbox 场景通常不需要额外的协议库，固定格式（命令号 + 参数字 + 状态 + 版本号）加一份两边共用的头文件（或由 PeakRDL 生成）即可。

下面的库只在两种情况下考虑：走 UART / JTAG 这类字节流通道，需要分帧和校验；或者命令多、结构复杂，host 和固件分开发布需要长期兼容。

| 库 | 作用 | 备注 |
|---|---|---|
| [lwpkt](https://github.com/MaJerle/lwpkt) | 轻量分包协议：起始标记、长度、CRC | 不使用动态内存；基于 lwrb；mailbox 场景一般不需要 |
| [min](https://github.com/min-protocol/min) | 小型可靠帧协议，带 CRC、确认和重传 | 不使用动态内存；固件端为 C，host 端提供 Python 实现；适合字节流通道 |
| [nanopb](https://github.com/nanopb/nanopb) | 嵌入式 protobuf，用一份 `.proto` 生成两端编解码代码 | 默认不使用动态内存，定义 `PB_ENABLE_MALLOC` 才用 `malloc`；只在消息结构复杂、需要版本兼容时考虑 |

## 单元测试

在 PC 上测试业务逻辑，不涉及指令集和硬件。

| 库 / 工具 | 作用 | 备注 |
|---|---|---|
| [Unity](https://github.com/ThrowTheSwitch/Unity) | 纯 C 单元测试框架 | 测试状态机、校准算法和异常分支；核心不使用动态内存，只有可选的 `extras/memory`（内存泄漏检测）用 `malloc` |
| [CMock](https://github.com/ThrowTheSwitch/CMock) | 根据头文件自动生成 mock | 配合 Unity，替代寄存器访问层；默认使用静态缓冲区，定义 `CMOCK_MEM_DYNAMIC` 后才改用 `realloc` |

## 仿真

没有芯片和 RTL 时，运行真实的固件。

| 库 / 工具 | 作用 | 备注 |
|---|---|---|
| [Spike](https://github.com/riscv-software-src/riscv-isa-sim) | RISC-V 官方指令集仿真器 | 验证启动代码、链接脚本、中断/异常 |
| [QEMU](https://www.qemu.org/) | 通用指令集仿真器 | 用 `virt` 机器快速运行固件 |
| [Unicorn](https://www.unicorn-engine.org/) | 轻量 CPU 仿真库，Python/C 调用，`pip` 可装 | 内存读写用回调处理，可直接挂接 Python 寄存器模型；没有外设、中断和虚拟时间，需要自己补 |
| [Renode](https://renode.io/) | 系统级仿真框架，可按真实地址映射搭平台 | 用 Python 给外设寄存器建模，可跑 host 交互流程 |

## 验证

固件和硬件 RTL 一起运行，确认模型和真实设计一致。

| 库 / 工具 | 作用 | 备注 |
|---|---|---|
| [Verilator](https://www.veripool.org/verilator/) | 开源 RTL 仿真器 | 固件和 RTL 联合仿真 |
| [cocotb](https://www.cocotb.org/) | 用 Python 写 testbench | 加载固件、模拟 host、判断结果 |

## 寄存器定义

三类环境共用的基础设施。

| 库 / 工具 | 作用 | 备注 |
|---|---|---|
| [PeakRDL](https://peakrdl.readthedocs.io/) | 从 SystemRDL 生成 C 寄存器头文件 | 固件、测试、仿真模型和 RTL 共用同一份寄存器定义 |

## 通用宏头文件

各项目共用的宏和小函数放在 [fw-lib](https://github.com/guaguagua/SystemBlog/tree/main/blog/tool/fw-lib) 目录，用标准 C11 写，不使用编译器扩展。

| 文件 | 作用 | 备注 |
|---|---|---|
| [fw_common.h](https://github.com/guaguagua/SystemBlog/blob/main/blog/tool/fw-lib/fw_common.h) | 编译期检查、数组与结构体、数值、位操作、位图、寄存器访问与轮询、断言 | 纯标准 C，只依赖 freestanding 头文件，可配合 `-nostdlib` |
| [fw_riscv.h](https://github.com/guaguagua/SystemBlog/blob/main/blog/tool/fw-lib/fw_riscv.h) | 链接属性、屏障、CSR 访问、关中断 | 标准 C 做不到，依赖 GCC / Clang 的 `__attribute__` 和 `__asm__`；`-march` 需包含 `zicsr` |

## 位图（状态标志）

记录一组状态（哪些通道已完成、哪些出错）用位图，不需要引入库，四个宏即可，数组在编译期定长，不使用动态内存。

```c
#define BM_DEFINE(name, nbits)  uint32_t name[((nbits) + 31) / 32]
#define BM_SET(bm, i)    ((bm)[(i) >> 5] |=  (1u << ((i) & 31)))
#define BM_CLR(bm, i)    ((bm)[(i) >> 5] &= ~(1u << ((i) & 31)))
#define BM_TEST(bm, i)   (((bm)[(i) >> 5] >> ((i) & 31)) & 1u)

BM_DEFINE(ch_done, 16);   // 16 个通道的完成标志
```

需要查找第一个置位的位时，用编译器内建的 `__builtin_ctz`。

## 建议的分层

固件不加硬件抽象层，直接用真实的 ELF，通过寄存器模型的行为来测试。

| 层级 | 工具 | 速度 | 定位 |
|---|---|---|---|
| **仿真（主力）** | Renode 或 Unicorn + Python 寄存器模型 | 秒级 | 日常开发和回归，覆盖主要流程和故障场景 |
| 指令集仿真 | Spike / QEMU | 秒级 | 可选，只检查启动代码、链接脚本、中断 |
| 验证 | Verilator + cocotb | 分钟到小时 | 关键节点和每晚回归，用 RTL 校准寄存器模型 |
| 单元测试 | Unity | 毫秒级 | 可选，只测不碰寄存器的纯函数（如从扫描结果里找最优点、CRC、数据包解析） |

寄存器模型写成与仿真器无关的纯 Python 类，Renode 和 Unicorn 可以共用，并且要定期用 RTL 仿真的结果来校准。

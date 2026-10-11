/*
 * fw_riscv.h - 与编译器 / RISC-V 相关的定义
 *
 * 标准 C 做不到的事集中放在这里：链接属性、CSR 访问、屏障、关中断。
 * 这些必须依赖编译器（GCC / Clang 的 __attribute__ 和 __asm__），
 * 换编译器时只需要改这一个文件。
 * 编译选项 -march 需包含 zicsr；使用 FW_FENCE_I 还需 zifencei。
 */
#ifndef FW_RISCV_H
#define FW_RISCV_H

#include "fw_common.h"

/* ---------- 链接与函数属性 ---------- */
#define FW_WEAK                 __attribute__((weak))
#define FW_USED                 __attribute__((used))            /* 防止被优化掉，如中断向量表 */
#define FW_SECTION(s)           __attribute__((section(s)))
#define FW_ALIGNED(n)           __attribute__((aligned(n)))
#define FW_NORETURN             _Noreturn                       /* 这个是标准 C11 */
#define FW_INTERRUPT            __attribute__((interrupt("machine")))

/* ---------- 屏障 ---------- */
#define FW_COMPILER_BARRIER()   __asm__ volatile("" ::: "memory")
#define FW_FENCE()              __asm__ volatile("fence iorw, iorw" ::: "memory")   /* 内存 + IO 全屏障 */
#define FW_FENCE_I()            __asm__ volatile("fence.i" ::: "memory")            /* 改写代码后同步取指 */

/* ---------- CSR 访问 ----------
 * 例：uint32_t cause; FW_CSR_READ(mcause, cause);
 *     FW_CSR_WRITE(mtvec, (uint32_t)trap_entry); */
#define FW_CSR_READ(csr, var) \
    __asm__ volatile("csrr %0, " FW_STR(csr) : "=r"(var) :: "memory")
#define FW_CSR_WRITE(csr, val) \
    __asm__ volatile("csrw " FW_STR(csr) ", %0" :: "r"((uint32_t)(val)) : "memory")
#define FW_CSR_SET(csr, bits) \
    __asm__ volatile("csrs " FW_STR(csr) ", %0" :: "r"((uint32_t)(bits)) : "memory")
#define FW_CSR_CLEAR(csr, bits) \
    __asm__ volatile("csrc " FW_STR(csr) ", %0" :: "r"((uint32_t)(bits)) : "memory")

/* ---------- 关中断 ----------
 * 用法：
 *     uint32_t flags = fw_irq_save();
 *     ... 临界区 ...
 *     fw_irq_restore(flags);
 * 可以嵌套：只有最外层的 restore 会重新开中断。 */
#define FW_MSTATUS_MIE          FW_BIT(3)

static inline uint32_t fw_irq_save(void)
{
    uint32_t old;
    __asm__ volatile("csrrc %0, mstatus, %1" : "=r"(old) : "r"(FW_MSTATUS_MIE) : "memory");
    return old & FW_MSTATUS_MIE;
}

static inline void fw_irq_restore(uint32_t flags)
{
    if (flags)
        FW_CSR_SET(mstatus, FW_MSTATUS_MIE);
}

#endif /* FW_RISCV_H */

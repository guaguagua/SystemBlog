/*
 * fw_common.h - 固件通用宏与小函数
 *
 * 只用标准 C11，不使用编译器扩展，任何编译器都能用。
 * 只依赖 freestanding 头文件，可配合 -nostdlib；不使用动态内存。
 * 与编译器 / RISC-V 相关的内容（属性、CSR、屏障、关中断）放在 fw_riscv.h。
 */
#ifndef FW_COMMON_H
#define FW_COMMON_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

/* ---------- 编译期检查 ---------- */
#define FW_STATIC_ASSERT(cond, msg)   _Static_assert(cond, msg)

/* ---------- 未使用的参数 ---------- */
#define FW_UNUSED(x)            ((void)(x))

/* ---------- 字符串化 / 拼接 ---------- */
#define FW_STR_(x)              #x
#define FW_STR(x)               FW_STR_(x)          /* 先展开宏再变成字符串 */
#define FW_CONCAT_(a, b)        a##b
#define FW_CONCAT(a, b)         FW_CONCAT_(a, b)

/* ---------- 数组 / 结构体 ---------- */
#define FW_ARRAY_SIZE(arr)      (sizeof(arr) / sizeof((arr)[0]))    /* 只能用于数组，不能用于指针 */

/* 由成员指针得到所在结构体的指针 */
#define FW_CONTAINER_OF(ptr, type, member) \
    ((type *)((char *)(ptr) - offsetof(type, member)))

/* ---------- 数值 ----------
 * FW_MIN / FW_MAX / FW_CLAMP / FW_ABS 可用于任意整数类型，参数只求值一次（FW_MIN(i++, j) 也安全）。
 * 原理：C11 的 _Generic 按参数相加后的类型，选择下面对应类型的 inline 函数。
 * 注意：有符号和无符号混用时按 C 的规则转成无符号再比较，FW_MIN(-1, 1u) 的结果不是 -1，应避免混用。 */
#define FW_DEF_NUM_FUNCS_(name, T)                                                    \
    static inline T fw_min_##name(T a, T b)        { return a < b ? a : b; }          \
    static inline T fw_max_##name(T a, T b)        { return a > b ? a : b; }          \
    static inline T fw_clamp_##name(T x, T lo, T hi) { return x < lo ? lo : (x > hi ? hi : x); }

FW_DEF_NUM_FUNCS_(i,   int)
FW_DEF_NUM_FUNCS_(u,   unsigned int)
FW_DEF_NUM_FUNCS_(l,   long)
FW_DEF_NUM_FUNCS_(ul,  unsigned long)
FW_DEF_NUM_FUNCS_(ll,  long long)
FW_DEF_NUM_FUNCS_(ull, unsigned long long)

static inline int       fw_abs_i(int x)        { return x < 0 ? -x : x; }
static inline long      fw_abs_l(long x)       { return x < 0 ? -x : x; }
static inline long long fw_abs_ll(long long x) { return x < 0 ? -x : x; }

#define FW_NUM_SELECT_(e, f)                  \
    _Generic((e),                             \
        int:                f##_i,            \
        unsigned int:       f##_u,            \
        long:               f##_l,            \
        unsigned long:      f##_ul,           \
        long long:          f##_ll,           \
        unsigned long long: f##_ull)

#define FW_MIN(a, b)            FW_NUM_SELECT_((a) + (b), fw_min)((a), (b))
#define FW_MAX(a, b)            FW_NUM_SELECT_((a) + (b), fw_max)((a), (b))
#define FW_CLAMP(x, lo, hi)     FW_NUM_SELECT_((x) + (lo) + (hi), fw_clamp)((x), (lo), (hi))
#define FW_ABS(x)                         \
    _Generic((x) + 0,                     \
        int:       fw_abs_i,              \
        long:      fw_abs_l,              \
        long long: fw_abs_ll)(x)          /* 只用于有符号数 */

#define FW_DIV_ROUND_UP(n, d)   (((n) + (d) - 1) / (d))

/* 以下 a 必须是 2 的幂，结果为 uint32_t */
#define FW_IS_POW2(x)           ((x) != 0 && ((x) & ((x) - 1)) == 0)
#define FW_ALIGN_UP(x, a)       (((uint32_t)(x) + ((uint32_t)(a) - 1u)) & ~((uint32_t)(a) - 1u))
#define FW_ALIGN_DOWN(x, a)     ((uint32_t)(x) & ~((uint32_t)(a) - 1u))
#define FW_IS_ALIGNED(x, a)     (((uint32_t)(x) & ((uint32_t)(a) - 1u)) == 0)

/* ---------- 位操作 ---------- */
#define FW_BIT(n)               (1u << (n))

/* 第 h 位到第 l 位全为 1，例：FW_GENMASK(7, 4) = 0xF0 */
#define FW_GENMASK(h, l)        ((0xFFFFFFFFu << (l)) & (0xFFFFFFFFu >> (31 - (h))))

/* mask 的最低位，例：FW_MASK_LSB(0xF0) = 0x10 */
#define FW_MASK_LSB(mask)       ((uint32_t)(mask) & (~(uint32_t)(mask) + 1u))

/* 把值放进 mask 对应的字段 / 从寄存器值里取出字段。mask 不能为 0
 * 例：FW_FIELD_PREP(0xF0, 3) = 0x30，FW_FIELD_GET(0xF0, 0x35) = 3 */
#define FW_FIELD_PREP(mask, val)  (((uint32_t)(val) * FW_MASK_LSB(mask)) & (uint32_t)(mask))
#define FW_FIELD_GET(mask, reg)   (((uint32_t)(reg) & (uint32_t)(mask)) / FW_MASK_LSB(mask))

/* ---------- 位图（状态标志），数组编译期定长 ---------- */
#define FW_BM_WORDS(nbits)          (((nbits) + 31) / 32)
#define FW_BM_DEFINE(name, nbits)   uint32_t name[FW_BM_WORDS(nbits)]
#define FW_BM_SET(bm, i)            ((bm)[(i) / 32] |=  (1u << ((i) % 32)))
#define FW_BM_CLR(bm, i)            ((bm)[(i) / 32] &= ~(1u << ((i) % 32)))
#define FW_BM_TEST(bm, i)           (((bm)[(i) / 32] >> ((i) % 32)) & 1u)

/* ---------- 寄存器访问 ---------- */
static inline uint32_t fw_read32(uintptr_t addr)
{
    return *(volatile uint32_t *)addr;
}

static inline void fw_write32(uintptr_t addr, uint32_t val)
{
    *(volatile uint32_t *)addr = val;
}

/* 读-改-写：只修改 mask 覆盖的位，val 是已经移好位的值 */
static inline void fw_rmw32(uintptr_t addr, uint32_t mask, uint32_t val)
{
    fw_write32(addr, (fw_read32(addr) & ~mask) | (val & mask));
}

/* 写 / 读寄存器里的某个字段，val 是字段本身的值（不用自己移位） */
static inline void fw_field_write32(uintptr_t addr, uint32_t mask, uint32_t val)
{
    fw_rmw32(addr, mask, FW_FIELD_PREP(mask, val));
}

static inline uint32_t fw_field_read32(uintptr_t addr, uint32_t mask)
{
    return FW_FIELD_GET(mask, fw_read32(addr));
}

/* 轮询寄存器，直到 (reg & mask) == val，最多读 max_iter 次
 * 成功返回 true，超时返回 false */
static inline bool fw_poll32(uintptr_t addr, uint32_t mask, uint32_t val, uint32_t max_iter)
{
    for (uint32_t i = 0; i < max_iter; i++) {
        if ((fw_read32(addr) & mask) == val)
            return true;
    }
    return false;
}

/* ---------- 断言与错误 ----------
 * fw_assert_fail 由项目实现（记录位置、通知 host、停机等），不应返回。
 * 只传文件 ID 和行号，不放文件名字符串，节省 ROM。 */
#ifndef FW_FILE_ID
#define FW_FILE_ID 0
#endif

void fw_assert_fail(uint16_t file_id, uint16_t line);

#ifndef FW_NDEBUG
#define FW_ASSERT(cond) \
    do { if (!(cond)) fw_assert_fail(FW_FILE_ID, __LINE__); } while (0)
#else
#define FW_ASSERT(cond)         ((void)0)
#endif

/* 出错时直接返回错误码，例：FW_TRY(phy_calib()); */
#define FW_TRY(expr) \
    do { int fw_rc_ = (expr); if (fw_rc_ != 0) return fw_rc_; } while (0)

#endif /* FW_COMMON_H */

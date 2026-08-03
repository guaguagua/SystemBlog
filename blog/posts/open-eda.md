---
title: 开源 EDA 工具全景汇总（含 Python / JS 生态）
category: 硬件工具
summary: 按 PCB、数字 ASIC、模拟版图、仿真验证、FPGA 工具链分类汇总主流开源 EDA 工具，梳理 OSS CAD Suite 与 OpenLane 的关系，并整理 Python 与 JS/TS 电路生态。
date: 2026-08-03
---

# 开源 EDA 工具全景汇总（含 Python / JS 生态）

开源 EDA 生态近年已经相当完整：从 PCB 打板、RTL 综合、仿真验证，到模拟版图，甚至配合开源 PDK（SkyWater SKY130、GF180MCU）可以完成真实流片。本文按"设计方向"分类梳理主流工具，然后单独介绍两大打包发行版（OSS CAD Suite / OpenLane）的关系，最后整理 Python 和 JS/TS 两个语言生态。

## 一张图看懂分类

| 你想做什么 | 推荐工具链 |
|---|---|
| 画 PCB 打板 | KiCad（首选）、LibrePCB、Horizon EDA |
| 数字芯片流片（ASIC） | Yosys + OpenLane/LibreLane + SKY130 PDK |
| FPGA 开发 | OSS CAD Suite（yosys → nextpnr → 位流） |
| 模拟/混合信号 | xschem + Magic + ngspice |
| 仿真验证 | Verilator / Icarus / GHDL + cocotb + GTKWave |
| 用 Python 写硬件 | Amaranth + cocotb |
| 版图/GDS 生成 | gdstk / GDSFactory / KLayout |

## PCB 设计（最常用、最成熟）

| 工具 | 用途 | 备注 |
|---|---|---|
| KiCad | 原理图 + PCB 设计 | 最成熟的开源 EDA，多层板、3D 预览、SPICE 仿真、ERC/DRC 齐全，可直接打板生产。 |
| LibrePCB | 原理图 + PCB | 界面现代，库管理优秀，项目结构清晰。 |
| Horizon EDA | 原理图 + PCB | 数据库驱动，强调数据一致性和可追溯性。 |
| gEDA / Lepton-EDA | 经典 Unix 风格工具集 | 适合脚本化流程。 |
| Fritzing | 面包板/原型图 | 面向创客和教学，面包板视图友好。 |
| QElectroTech | 电气原理图绘制 | 偏工业电气图，不是 PCB 工具。 |

## 数字 IC / ASIC 设计流程（RTL → GDS）

| 工具 | 用途 | 备注 |
|---|---|---|
| Yosys | 逻辑综合 | 开源综合核心，支持 Verilog/SystemVerilog，几乎所有开源数字流程的前端。 |
| ABC（Berkeley） | 逻辑优化与综合 | 常作为 Yosys 的技术映射后端。 |
| OpenROAD | 布局布线（P&R）、时序、物理验证 | DARPA 资助的核心项目，ASIC 后端事实标准。 |
| OpenLane / LibreLane | 全自动 RTL-to-GDS 流程 | 封装 Yosys + OpenROAD + Magic/KLayout，支持 SKY130 等开源 PDK；LibreLane 是 OpenLane 的社区后继。 |
| iEDA | 从网表到 GDS 的完整基础设施 | 中国开源芯片项目，国产开源 EDA 代表，已完成多次流片。 |
| OpenSTA / OpenTimer | 静态时序分析 | 常配 Yosys/OpenROAD 使用。 |
| DREAMPlace | 基于深度学习的布局工具 | 研究向，性能强于传统布局器。 |

## 模拟 / 混合信号与版图

| 工具 | 用途 | 备注 |
|---|---|---|
| Xschem | 模拟原理图编辑 | 面向 VLSI/模拟自定义设计，常与 ngspice、SKY130 PDK 配套。 |
| Magic | 版图编辑、DRC/LVS、提取 | 经典工具，开源 PDK 流片标配，常配 ngspice 做模拟组合。 |
| KLayout | GDS/OASIS 查看编辑、DRC 脚本 | 高性能版图查看器，脚本能力强，工业级水平。 |
| Electric | 完整 VLSI 设计系统 | 原理图到布局一体，老牌项目。 |

## 仿真与验证

| 工具 | 用途 | 备注 |
|---|---|---|
| Verilator | Verilog/SystemVerilog 仿真 | 编译成 C++，最快的开源 Verilog 仿真器。 |
| Icarus Verilog | Verilog 仿真 | 轻量经典，适合小项目和教学。 |
| GHDL | VHDL 仿真 | 支持 ghdl-yosys-plugin 做 VHDL 综合。 |
| ngspice / Xyce | SPICE 电路级仿真 | ngspice 最常用；Xyce 是 Sandia 出品的大规模并行 SPICE。 |
| cocotb | Python 写 testbench 的验证框架 | 最主流的验证框架，配 Verilator/Icarus/GHDL。 |
| SymbiYosys（sby） | 形式化验证 | 基于 Yosys + SMT 求解器（Z3、Yices、Boolector）。 |
| GTKWave | 波形查看 | 各仿真器输出的通用查看器。 |

## FPGA 工具链

| 工具 | 用途 | 备注 |
|---|---|---|
| nextpnr | FPGA 布局布线 | 支持 generic / ice40 / ecp5 / nexus / gowin。 |
| Project IceStorm | Lattice iCE40 位流文档化与生成 | 最早的完全开源 FPGA 流程。 |
| Project Trellis | Lattice ECP5 位流工具 | 配合 nextpnr-ecp5。 |
| Project X-Ray | Xilinx 7 系列位流文档化 | F4PGA 的底层。 |
| F4PGA（原 SymbiFlow） | 通用开源 FPGA 流程 | 面向 Xilinx 7 系列等。 |
| apicula | 国产 Gowin FPGA 的开源位流工具 | 配合 nextpnr-gowin。 |
| openFPGALoader | 通用 FPGA 下载/烧录 | 支持众多板卡和线缆。 |

## 配套生态

- **Open PDK**：SkyWater SKY130、GF180MCU，真正能流片的开源工艺库（Tiny Tapeout、Google OpenMPW 都用它）。
- **OpenRAM**：存储器编译器，自动生成 SRAM。
- **OpenFASoC**：模拟/混合信号模块自动生成。
- **eSim**：集成 KiCad、ngspice、Verilator 等的教学/综合环境。

## OSS CAD Suite

OSS CAD Suite 是 **YosysHQ 官方维护的开源 EDA 工具链二进制发行包**（付费版 Tabby CAD Suite 的免费社区版，Tabby 提供更强的 SystemVerilog/VHDL 支持）。它把一堆常用工具编译打包好，免去逐个编译安装的麻烦。

**包含的主要工具：**

- Yosys、nextpnr（ice40 / ecp5 / nexus / gowin / generic）
- Project IceStorm、Project Trellis、Project X-Ray、apicula
- Verilator、Icarus Verilog、GHDL（含 ghdl-yosys-plugin）
- Amaranth HDL、FHDL、pyRTL
- cocotb、GTKWave
- sby（SymbiYosys）+ Boolector、Yices、Z3 等 SMT 求解器
- dfu-util、openFPGALoader

**特点：**

- 跨平台：Windows（x64/arm64）、Linux（含 ARM）、macOS、Raspberry Pi 都有预编译包。
- 免安装：解压后运行 `environment`（Linux/macOS）或 `start.bat` / `environment.bat`（Windows）激活环境，所有工具即进入 PATH。
- 版本由 YosysHQ 联调，工具间兼容性有保障，避免依赖地狱。

**典型用途：**

Lattice iCE40 / ECP5、Gowin 等 FPGA 的完全开源开发流程：

```
yosys → nextpnr → icepack/ecppack → openFPGALoader
```

## OSS CAD Suite 与 OpenLane 的关系

两者没有从属关系，是**面向不同目标的两套"打包好的开源工具链"**，底层有部分工具重叠（主要是 Yosys）。

| | OSS CAD Suite | OpenLane / LibreLane |
|---|---|---|
| 维护方 | YosysHQ | 原 Efabless，现社区 + OpenROAD 项目团队 |
| 目标 | **FPGA** 开发 + 仿真/形式验证 | **ASIC 流片**：RTL → GDSII，基于 SKY130 / GF180 开源 PDK |
| 终点产物 | FPGA 位流文件（`.bin`/`.bit`） | 交给晶圆厂的版图（`.gds`） |
| 分发形式 | 解压即用的二进制包 | Docker 镜像（LibreLane 也支持 nix/pip） |
| 核心流程 | yosys → nextpnr → icepack/ecppack | yosys → OpenROAD → Magic/KLayout → GDS |

**交集与差异：**

- 交集：双方都用 **Yosys** 做综合（OpenLane 的综合阶段直接调用它），都含 GTKWave、Verilator 等通用工具。但 OpenLane 的核心是 **OpenROAD**（ASIC 布局布线），OSS CAD Suite 的核心是 **nextpnr**（FPGA 布局布线）——两个后端是互斥的赛道。
- OSS CAD Suite **不包含** OpenLane、OpenROAD、Magic 这些 ASIC 工具；OpenLane 的 Docker 镜像自带一套固定版本的 Yosys/OpenROAD/Magic/KLayout，两者互不依赖，可以共存安装。

**怎么选：**

- 玩 FPGA 开发板、做仿真验证 → OSS CAD Suite
- 想做数字芯片设计、参加 Efabless/Tiny Tapeout 这类开源流片 → OpenLane / LibreLane

一句话：一个是"FPGA 工具包"，一个是"造芯片的流水线"，Yosys 是它们共用的前端。

## Python 电路/硬件库

Python 在硬件领域的库按用途分类如下。

**硬件描述（HDL）/ SoC 构建**

| 库 | 用途 | 备注 |
|---|---|---|
| Amaranth（原 nMigen） | Python 写数字逻辑，生成 Verilog | 最活跃、推荐首选，OSS CAD Suite 自带。 |
| Magma | 低层级 Python HDL（Stanford） | 以 Circuit 为抽象、强调精确接线和生成器，配 Mantle/Loam/CoreIR 生态，目前维护相对较少。 |
| migen / LiteX | SoC 构建框架 | migen 是 Amaranth 前身；LiteX 能整套生成带 CPU 的 SoC（LiteDRAM/LitePCIe 等）。 |
| MyHDL | Python 写 RTL，转 Verilog/VHDL | 最早的 Python HDL 之一，成熟但更新慢。 |
| PyMTL3 | 多层级建模（功能级 → RTL） | 研究向，验证能力强。 |
| PyRTL | 教学向的 Python RTL 描述与仿真 | 轻量易上手，适合快速原型。 |

Python HDL 速选：**新项目用 Amaranth**；需要精细控制/对接 CoreIR 看 Magma；搭 SoC 用 LiteX；教学用 PyRTL。

**验证与构建**

| 库 | 用途 | 备注 |
|---|---|---|
| cocotb | 用 Python 写 testbench | 最主流的验证框架，配 Verilator/Icarus/GHDL。 |
| pyuvm | UVM 的 Python 实现 | 基于 cocotb，复刻 SystemVerilog UVM。 |
| edalize | 统一调用各 EDA 后端（Yosys、Vivado、Quartus 等） | 构建抽象层。 |
| FuseSoC | IP 核管理与构建系统 | 基于 edalize，管理 HDL 包依赖。 |

**模拟电路仿真与分析**

| 库 | 用途 | 备注 |
|---|---|---|
| PySpice | Python 接口驱动 ngspice / Xyce | 最常用，支持参数扫描、结果提取、优化。 |
| PyLTSpice | 批量控制 LTspice | Windows 用户跑批量仿真方便。 |
| lcapy | 符号化电路分析（基于 SymPy） | 拉普拉斯域、传递函数，教学神器。 |
| CircuitCalculator | 符号 + 数值电路分析 | DC/AC、节点分析、状态空间。 |
| ahkab | 纯 Python 的 SPICE 类仿真器 | 无需外部引擎，适合教学/小电路。 |
| schemdraw | 画电路原理图（代码生成） | 写文档、出图方便，支持逻辑门和晶体管符号。 |

**PCB / 原理图（代码描述电路）**

| 库 | 用途 | 备注 |
|---|---|---|
| SKiDL | 最流行的"代码写原理图"库 | 生成 KiCad 网表、BOM，可接仿真，适合参数化设计。 |
| edg（Polymorphic Blocks） | 高层次 PCB 子电路生成器 | 生成稳定 KiCad 网表。 |
| circuit-synth | Python 定义电路 + AI 辅助 | 双向与 KiCad 交互，支持制造文件。 |
| pyschem | 代码画原理图并导出 SVG | 自动布线、支持 KiCad 符号库。 |
| pcbnew（KiCad 内置 API） | KiCad 的 Python 脚本接口 | 批量改封装、自动化处理。 |
| pcb-tools / kikit | Gerber/Excellon 解析渲染、拼版 | 生产文件自动化。 |

**版图 / GDS**

| 库 | 用途 | 备注 |
|---|---|---|
| gdstk / gdspy | 读写生成 GDSII 版图 | gdspy 已停更，gdstk 是其 C++ 加速继任者。 |
| GDSFactory | 参数化版图（PDK 单元 + 布线） | 最活跃的 GDS 布局库（光子、模拟、量子、MEMS），基于 gdstk/KLayout。 |
| KLayout Python API | 版图处理、DRC 脚本 | 工业级能力。 |
| phidl | 基于 gdspy 的版图生成 | 光子学/微纳加工常用。 |
| KQCircuits | 超导量子电路版图 | 基于 KLayout。 |
| SQcircuit | 超导量子电路分析 | 研究向。 |

**其他周边**

- **PyVerilog** — 解析 Verilog 源码（AST），做代码分析/转换。
- **circuitgraph** — 把电路当图处理（NetworkX + Yosys）。
- **pyfda** — 数字滤波器设计 GUI 工具。

**推荐组合：**

- 模拟电路 + 原理图：`SKiDL` + `PySpice`
- 数字 FPGA / ASIC：`Amaranth`（或 PyMTL3）+ `cocotb` → OSS CAD Suite / OpenLane
- 芯片版图（光子/模拟/量子）：`GDSFactory`
- 完整开源 ASIC 流：Python HDL → Verilog → OpenLane/LibreLane

## JS/TS 电路库

JS/TS 相关的电路库虽然没有 Python 多，但近几年发展很快，尤其是 **PCB 设计**和**数字逻辑仿真**两个方向。整体定位仍是**可视化和前端交互**强、工业级工具链弱。本站《GitHub Pages 博客可用的前端 JS 库汇总》一文从"博客可用"角度也整理过其中部分库。

**PCB / 原理图设计（最成熟的方向）**

| 库 | 用途 | 备注 |
|---|---|---|
| tscircuit | 用 TypeScript + React 写真实电路 | 目前 JS/TS 生态最活跃、功能最全：可生成原理图、PCB、Gerber、BOM、3D 预览，支持自动布线，甚至能直接下单制造。 |
| @tscircuit/core | tscircuit 的核心（无 React 版本） | 纯 TypeScript 构建 Circuit JSON。 |
| circuit-json | tscircuit 的中间表示格式 | 统一描述原理图/PCB/仿真数据。 |
| circuit-to-svg | Circuit JSON → SVG | 生成原理图/PCB/装配图。 |
| kicad-sch-ts | 读写 KiCad 原理图文件 | 适合程序化操作 KiCad 项目。 |
| easyeda（npm） | 转换 EasyEDA 封装 | 可把 EasyEDA 部件转成 tscircuit 组件。 |
| pcb-stackup / tracespace | Gerber → SVG/网页预览 | 开源硬件项目展示 PCB 渲染图常用。 |
| gerber-to-svg / gerber-parser | Gerber 文件解析渲染 | tracespace 生态的底层库。 |

tscircuit 示例风格（类似 React）：

```tsx
<board width="10mm" height="10mm">
  <resistor name="R1" resistance="10k" footprint="0402" />
  <led name="LED1" footprint="0402" />
  <trace from=".R1 > .pin2" to=".LED1 > .pos" />
</board>
```

**数字逻辑 / HDL**

| 库 | 用途 | 备注 |
|---|---|---|
| Simten | TypeScript 原生 HDL | 可在浏览器里仿真，能导出 Verilog，支持综合到 FPGA。 |
| gateware-ts | TypeScript → Verilog | 生成可综合的 Verilog，对接开源 FPGA 工具链。 |
| circuit-ts | 逻辑电路仿真库 | 用代码搭门电路、触发器等，适合教学和原型。 |
| hdl-js | HDL 解析器 + 仿真器 | 解析简单 HDL 并仿真。 |
| DigitalJS | 浏览器里的门级数字电路仿真 | BSD 许可，配合 `yosys2digitaljs` 可把 Yosys 综合结果变成可交互电路。 |
| yosys2digitaljs | Yosys JSON 网表 → DigitalJS 格式 | 格式转换工具，Verilog 进浏览器的关键一环。 |
| YosysJS | Yosys 编译成 WASM 在浏览器跑 | 实验性质，证明前端也能做综合。 |
| simcirJS | 逻辑电路仿真 UI（可拖拽搭建） | 轻量，适合教学演示页。 |
| CircuitJS1（Falstad） | 模拟/混合信号电路仿真 | GWT 编译的 JS，经典在线仿真器，GPL 许可。 |
| CircuitVerse | 在线数字电路仿真平台 | 前端主要用 JS。 |

**波形 / 原理图可视化**

| 库 | 用途 | 备注 |
|---|---|---|
| WaveDrom | 数字时序图（WaveJSON → SVG） | 写总线协议、握手时序文档的标配。 |
| netlistsvg | Yosys JSON 网表 → SVG 原理图 | MIT 许可，配 Verilog/Yosys 工作流。 |
| vcdrom | VCD 波形文件在浏览器渲染 | 基于 WaveDrom，仿真结果可视化。 |
| HDElk | 网页 HDL 框图可视化 | 用 JS 对象描述 HDL 结构并画图。 |
| elkjs / dagre | 自动布局算法 | 只算布局不画图，常配 SVG/Canvas 画网表图、模块连接图。 |

**其他相关工具**

- **JS-PCB** — 纯 JavaScript 的 PCB 自动布线器。
- **TerosHDL / Colibri2** — TypeScript 写的 HDL 工具后端（解析、文档生成、Lint 等）。
- **velo-circuit** — 电化学阻抗谱（EIS）相关电路编辑器（TypeScript）。

**怎么选：**

| 需求 | 推荐 |
|---|---|
| 做真实可制造的 PCB | tscircuit（首选） |
| 在浏览器里玩数字逻辑 / 学习 HDL | Simten 或 circuit-ts |
| 从 TS 生成 Verilog 上 FPGA | gateware-ts 或 Simten |
| 操作现有 KiCad 文件 | kicad-sch-ts |
| 博客/文档画时序图、网表图 | WaveDrom、netlistsvg |

**特点总结：**

- JS/TS 强项：波形图、时序图、原理图 SVG、PCB 预览——适合静态博客和文档。
- 弱项：没有成熟的 JS 版 SPICE 或布局布线工具，真正的仿真/综合还是靠 Verilator、Yosys、ngspice 这些原生工具，JS 主要做"展示层"。
- 例外是 **tscircuit**：它在把 PCB 设计本身搬进 TS 生态，已经能跑通代码 → 原理图 → PCB → Gerber 的完整流程。

## 参考链接

- OSS CAD Suite: https://github.com/YosysHQ/oss-cad-suite-build
- OpenLane: https://github.com/The-OpenROAD-Project/OpenLane ｜ LibreLane: https://github.com/librelane/librelane
- OpenROAD: https://github.com/The-OpenROAD-Project/OpenROAD
- KiCad: https://www.kicad.org/
- iEDA: https://github.com/OSCC-Project/iEDA
- F4PGA: https://github.com/chipsalliance/f4pga
- SKY130 PDK: https://github.com/google/skywater-pdk
- Amaranth: https://github.com/amaranth-lang/amaranth ｜ Magma: https://github.com/phanrahan/magma
- GDSFactory: https://github.com/gdsfactory/gdsfactory

---
title: "28.85%: How Much of the Wealth Created by an Ordinary Helsinki Family Over a Lifetime Is Extracted by Finland's Institutional System?"
excerpt: "— A Component-by-Component Estimate of the Lifecycle Comprehensive Extraction Rate for Urban Families in Finland"
header:
  teaser: /assets/img/page-header-image-smallfamily-teaser.jpg
  overlay_image: /assets/img/page-header-image-smallfamily.jpg
  overlay_filter: 0.4
categories:
  - Society
tags:
  - LCER
  - Lifecycle Comprehensive Extraction Rate
  - Finland
  - Helsinki
  - Tampere
  - Welfare State
  - Tax Burden
  - Social Security
  - Pensions
  - Public Healthcare
  - Household Wealth
  - Institutional Costs
  - Real Estate
  - Mortgage Financing
  - Education Spending
  - Wealth Distribution
  - Social Commentary
toc: true
toc_sticky: true
series: lcer
series_order: 7
series_label: "Finland: Helsinki and Tampere"
sidebar:
  title: "Classic Series"
  nav: sidebar-series-lifecycle-extraction
locale: en
translation_key: society-article-0007-2026
last_modified_at: 2026-10-14T01:55:52-05:00
---

In the previous article, we calculated the Lifecycle Comprehensive Extraction Rate (LCER) for an ordinary family in Germany.

The results were:

> - **Munich: 38.4%.**
> - **Cologne: 35.3%.**

Taxes and social insurance contributions are high in Germany. Even after deducting pension and healthcare benefits attributable to the household, net institutional extraction still accounts for more than one-third of the lifetime labor value created by an ordinary two-earner family.

Next, I want to look at Finland.

Finland is often held up as an example of the Nordic high-tax, high-welfare model. It has extensive public education, healthcare, and pension systems, while requiring substantial taxes and mandatory contributions from employees and employers.

According to the OECD, the labor tax wedge for a single, childless worker earning the average wage in Finland reached **42.7%** in 2021.[^tax-wedge] That is already a considerable burden.

Under the usual interpretation of taxation, if an employer spends €100 to employ someone, and there is a large gap between that cost and the employee's take-home pay, it may seem reasonable to say that the state has taken a large part of the money.

But the calculations for the preceding countries have already shown that **the amount a household pays in taxes and contributions is not the same as the share of its labor value ultimately extracted on a net basis.**

After comparing household education spending against our common 1.5% benchmark, and retaining the negative difference when spending falls below that benchmark, the conditional estimates in this article are:

> - **Helsinki: 28.85%.**
> - **Tampere: 26.28%.**

The education component uses a household-budget proxy built from national consumption data, not direct observations of two-earner, one-child families in either city. Nor should these percentages be interpreted as precisely measured burdens for every household.[^education-data]

On this estimate, Helsinki's LCER is lower than the figures previously calculated for Munich, Paris, and Toronto. Tampere is relatively close to Winnipeg.

So why does Finland, despite its substantial taxes, end up with a lower LCER than Germany?

## 1. The Same Ordinary Family, This Time in Helsinki and Tampere

We continue to use the standard household from the preceding articles: two married adults, both working full-time in the private sector, raising one child, and beginning their working lives at age 25. The base year is 2021, the real discount rate is 2%, and long-run real wage growth is assumed to be 0%.[^lcer][^pv]

In the OECD's 2021 pension model, the normal pension age for an average-income worker in Finland is 68. We therefore use a 43-year working life.[^pension-age]

Education expenditures are recognized at the end of each year. The present values of earnings, taxes, contributions, and existing benefits are also converted using the same factor to make them compatible with that convention. Adjusting numerator and denominator together does not, by itself, increase the extraction rate. Because the timing of some cash flows still rests on model assumptions, the amounts and ratios below remain conditional estimates.[^pv-timing]

As before, we select two cities.

Helsinki is Finland's main economic center, with relatively high wages and housing prices. Tampere is an important center of industry, technology, and services, with a developed labor market but substantially lower housing prices than the capital.

Statistics Finland reports that the median monthly salary of full-time private-sector employees nationwide was **€3,520** in 2021. Using national and regional earnings differentials, the model estimates representative monthly private-sector salaries of approximately €3,886 in Helsinki and €3,462 in Tampere.[^wages]

These city figures are estimates derived from official regional wage relationships, not directly published city-specific private-sector medians.

Assuming both adults earn the same wage:

| Item | Helsinki | Tampere |
| --- | ---: | ---: |
| Monthly wage per worker | €3,886 | €3,462 |
| Annual wage per worker | €46,632 | €41,544 |
| Annual household cash wages | €93,264 | €83,088 |
| Additional mandatory employer contribution rate | 19.7% | 19.7% |
| Annual household labor value | €111,673 | €99,489 |
| **Present value of lifetime labor value** | **€3,200,733** | **€2,851,503** |

*Annual wages and labor value retain their 2021 basis. Present values reflect the synchronized conditional timing conversion described above. Individual amounts are generally rounded in the text; final totals use unrounded values from the calculation sheet.*

Finnish employers pay more than their employees' cash wages. They must also make statutory contributions related to pensions, healthcare, and other social insurance. The model includes these mandatory employer costs in the denominator rather than counting only the salaries received by employees.

Thus, the labor value produced by an ordinary two-earner family in Helsinki between ages 25 and 68, discounted to age 25, is approximately **€3.201 million**. In Tampere, it is about **€2.852 million**.

We can now examine what this household pays over its lifetime in contributions, taxes, and housing finance, as well as the benefits it receives.

## 2. Finnish Pensions: A 24.4% Contribution Rate Does Not Mean 24.4% Extraction

One of Finland's most important mandatory social insurance arrangements is its earnings-related pension system.

In 2021, the average combined contribution rate under TyEL, Finland's statutory earnings-related pension arrangement for private-sector employees, was **24.4% of wages**, with employers paying a substantial share.[^tyel]

<figure class="fr-figure"><img src="https://kewtgh.github.io/PicSunflowers/img/2026/ai-finland-the-government-took-the-money-01.jpg" alt="ai-finland-the-government-took-the-money-01" /></figure>

That is not a low rate.

But pensions are different from ordinary taxes. Contributions paid during working life establish entitlements to pension payments after retirement. Finnish earnings-related benefits depend on employment income, years of accrual, and other factors. We therefore cannot count the entire 24.4% as wealth permanently extracted from the household.

The OECD's 2021 model gives a **56.6%** gross pension replacement rate for an average-income Finnish worker with a complete career. Since this series starts the working life at age 25, rather than using the OECD's full-career assumptions, the Finnish model adjusts the rate to approximately **53%**. This is the ratio of annual gross pension income to pre-retirement gross wages. The 53% used here is a modeling parameter, not a measured average for all Finnish retirees.[^pension-age]

How much pension would someone receive each year, and for how many years? We need both pieces of information to calculate retirement benefits.

First, the payment period. According to Statistics Finland's 2021 life table, a man who has already reached age 68 has an average **16.19 years** of remaining life expectancy; for a woman of the same age, it is **19.38 years**. These imply conditional expected ages of approximately **84.19** and **87.38**, respectively. We must use life expectancy conditional on having reached 68, rather than simply subtracting 68 from life expectancy at birth.[^life-expectancy]

| Longevity and payment-period assumption | Men | Women |
| --- | ---: | ---: |
| Retirement age in this model | 68 | 68 |
| 2021 life table: remaining life expectancy at 68 | 16.19 years | 19.38 years |
| Conditional expected age attained | 84.19 | 87.38 |
| Whole-year payment-period approximation used | 16 years | 19 years |

The official life-table estimates retain decimals. Our pension cash-flow model uses 16 full years of payments for the man and 19 for the woman. It is an annual-payment approximation, not an actuarial calculation weighted by survival probabilities at each age, nor a prediction that everyone dies at 84 or 87. The life table describes mortality conditions in 2021; we do not separately forecast changes in longevity over the following decades.[^pension-cashflow]

Next, the amounts. With long-run real wage growth set at 0%, annual earnings per person are €46,632 in Helsinki and €41,544 in Tampere. Using a gross replacement rate of 53%:

\[
\text{Annual gross pension per person}=\text{Pre-retirement annual gross wage}\times53\%
\]

| Annual pension amounts in 2021 purchasing power | Helsinki | Tampere |
| --- | ---: | ---: |
| Annual wage before retirement, per person | €46,632 | €41,544 |
| Modeled gross pension replacement rate | 53% | 53% |
| **Annual pension for the man** | **€24,714.96** | **€22,018.32** |
| **Annual pension for the woman** | **€24,714.96** | **€22,018.32** |
| Monthly pension equivalent, per person | €2,059.58 | €1,834.86 |
| Household annual pension while both collect | €49,429.92 | €44,036.64 |

The couple are assumed to earn identical wages, so the modeled annual pensions are also identical. That does not mean Finnish men and women receive equal average pensions in reality. The woman's longer modeled payment period produces a higher cumulative benefit. Over 16 and 19 years, the Helsinki man's cumulative pension is about €395,400 and the woman's about €469,600; the equivalent figures for Tampere are approximately €352,300 and €418,300. These are undiscounted amounts in constant 2021 purchasing power, not nominal totals including future inflation.

Finally, we discount each annual pension payment to the point when the household begins working at age 25. Retirement at 68 corresponds to \(t=43\). The first complete annual pension payment is recognized at the end of the first year after retirement, or \(t=44\). There are 16 payments for the man, through \(t=59\), and 19 for the woman, through \(t=62\). In this approximation, the real purchasing power of pension payments remains constant in retirement. We calculate the two payment streams separately rather than continuing to count both pensions until the end of the woman's payment period.[^pension-cashflow]

For Helsinki:

\[
PV_{\text{pension benefits}}=
24,714.96\left(
\sum_{t=44}^{59}\frac{1}{1.02^t}
+
\sum_{t=44}^{62}\frac{1}{1.02^t}
\right)
\approx €308,582
\]

Applying the same method to Tampere gives approximately €274,912. The present value of pension benefits is therefore around €308,600 in Helsinki and €274,900 in Tampere. Differences of less than one euro from the amounts below reflect intermediate rounding.[^pension-cashflow]

Combining contributions and benefits:

| Pension item | Helsinki | Tampere |
| --- | ---: | ---: |
| Present value of pension contributions | €652,234 | €581,070 |
| Present value of pension benefits | €308,581 | €274,913 |
| **Present value of net pension extraction** | **€343,653** | **€306,157** |
| **Share of lifetime labor value** | **10.74%** | **10.74%** |

For the Helsinki household, the present value of lifetime pension contributions is about €652,000, while the expected present value of retirement benefits is approximately €309,000.

The difference is around **€344,000**, or **10.7%** of lifetime labor value. Tampere's result is also approximately 10.7%.

Finnish pensions therefore provide substantial retirement income, but within the cash-flow assumptions of this standard household, the present value of contributions still exceeds that of the pensions expected to be received.

This difference does not mean the pension system wastes the money. Pension insurance also provides protection against longevity risk, transfers resources between generations, and redistributes income. LCER measures the difference between identifiable contributions and benefits for this modeled household. It is not a judgment about the overall value of the pension system.

There is an interesting comparison here: net pension extraction in the German model was about 8.0%, while in Finland it is approximately 10.7%.

Finland's lower overall LCER, then, cannot simply be explained by a lower net extraction rate from pensions.

## 3. Healthcare: Why Is Finland's Net Extraction Negative?

Finland's healthcare results look quite different from Germany's.

In Germany, statutory health insurance is largely financed through contributions linked to employment income. Both employers and employees contribute, so higher wages generally mean higher contributions.

Finnish public healthcare relies more heavily on public financing. The services residents use are not paid for solely by dedicated health-insurance contributions on their payslips. A substantial share is financed through general taxation.

This changes how healthcare appears in a household's lifetime accounts.

Under the current model, the present value of public healthcare services reasonably attributable to the couple and their child over their lifetimes is approximately **€274,589**. This is estimated from public healthcare spending and age-specific patterns of healthcare use. It is not an observed record of one family's medical bills.[^health]

Both cities use the same family age structure and assumptions about attributable services, so the estimated benefit amount is identical.

| Healthcare item | Helsinki | Tampere |
| --- | ---: | ---: |
| Present value of dedicated health financing and contributions | €95,429 | €85,017 |
| Present value of public healthcare benefits | €274,589 | €274,589 |
| **Present value of net healthcare extraction** | **−€179,160** | **−€189,573** |
| **Share of lifetime labor value** | **−5.60%** | **−6.65%** |

On the present attribution of dedicated financing and public healthcare benefits, net healthcare extraction is approximately **−5.60%** in Helsinki and **−6.65%** in Tampere.

The negative figure does not mean that the Finnish government hands an ordinary household an additional €180,000 in cash, or that healthcare is entirely free to provide. It means that **within this category, the present value of healthcare services attributed to the family exceeds the present value of the dedicated health contributions recorded separately.**

A large part of Finnish healthcare is funded through general taxes, already included in the personal income tax component below. Taxes and healthcare benefits must therefore be examined together. The negative amount on its own does not establish that Finnish healthcare is cheaper than Germany's.

In the household's overall fiscal and social insurance accounts, this negative amount offsets some of the net extraction arising from pensions, income taxes, and consumption taxes.

The percentage is more negative in Tampere for another reason. Household earnings are lower, so the denominator—lifetime labor value—is smaller. Under the assumption of identical household composition, however, the value of public healthcare services does not fall in proportion to wages.

That also helps explain part of the final LCER difference between the two cities.

## 4. Income and Consumption Taxes: Welfare Benefits Do Not Make Taxes Disappear

With pension and healthcare balances accounted for, we can turn to Finnish income and consumption taxes.

Personal income taxation in Finland involves national and municipal income taxes and relevant deductions. The effective rate an individual pays depends on income and applicable rules; we cannot simply apply the highest marginal tax rate to the entire household wage.[^income-tax]

The model estimates the following present values of personal income taxes:

- Helsinki: **€542,637**, or around **16.95%** of lifetime labor value.
- Tampere: **€440,565**, or around **15.45%** of lifetime labor value.

Income taxes alone represent a substantial lifetime payment for an ordinary Finnish two-earner household.

Once the household has paid income tax and received its disposable income, it must also pay value-added tax (VAT) on goods and services, as well as excise duties on products such as energy, alcohol, and tobacco.[^vat]

Finland's standard VAT rate in 2021 was 24%, but actual household spending includes goods and services with reduced rates or exemptions. The model therefore estimates the tax burden associated with household consumption rather than applying 24% directly to all wages.

| Fiscal and social insurance item | Helsinki | Tampere |
| --- | ---: | ---: |
| Net pension extraction | €343,653 | €306,157 |
| Net healthcare extraction | −€179,160 | −€189,573 |
| Personal income tax | €542,637 | €440,565 |
| VAT burden | €173,769 | €158,860 |
| Other consumption taxes | €33,099 | €30,259 |
| **Net fiscal and social insurance extraction** | **€913,998** | **€746,269** |
| **Share of lifetime labor value** | **28.56%** | **26.17%** |

The overall fiscal and social insurance calculation is now easier to understand.

For the Helsinki family, net pension extraction is approximately €344,000, income tax is around €543,000, and VAT plus other consumption taxes amount to roughly €207,000. At the same time, public healthcare benefits offset about €179,000 beyond the dedicated healthcare contributions.

The result is **28.56%**. For Tampere, it is **26.17%**.

Finnish households pay considerable amounts in taxes and social insurance. Ignoring the pensions and healthcare services they later receive, however, would make it impossible to understand how much is ultimately extracted on a net basis.

For other social insurance programs, including unemployment and occupational injury insurance, the present model lacks sufficiently stable information about lifetime benefit receipt and eligibility for an ordinary household. It therefore provisionally treats contributions and expected benefits as offsetting, giving a net figure of zero rather than treating every contribution as extraction. This conservative convention does not mean the programs are free or have no fiscal cost.

## 5. Helsinki Housing Is Expensive. Why Is Institutional Housing Extraction Zero?

The housing component may be even more surprising than healthcare.

According to Statistics Finland, representative second-hand apartment prices in 2021 were approximately **€4,775 per square meter** in Helsinki and **€2,752** in Tampere.[^house]

For Finland, this round of the model uses a standard 75-square-meter home:

| Housing item | Helsinki | Tampere |
| --- | ---: | ---: |
| Price of a 75 m² home | €358,125 | €206,400 |
| Home price / annual household cash wages | 3.84× | 2.48× |
| Identified institutional housing component (central estimate) | 0.0% | 0.0% |

An ordinary home in Helsinki costs around €358,000, roughly 1.7 times the price of its Tampere counterpart.

Why, then, is the institutional housing component of LCER zero?

Our calculations for Shanghai, New York, London, and Munich have repeatedly encountered the same issue: **an expensive home does not mean that its entire price represents institutional extraction.**

A home has a construction value, and its land has a location value. Employment opportunities, population concentration, incomes, and housing supply all influence prices. Only an identifiable and credibly estimable institutional premium can be counted separately as housing extraction.

Finland also has land-use planning and housing supply restrictions. But the current model does not have a sufficiently reliable estimate that would allow us to attribute a specific amount of Helsinki housing prices to planning restrictions without mixing in ordinary land scarcity and location value. We have therefore not invented an institutional housing premium for Helsinki.

Finland also used to levy a property transfer tax on these transactions.

Under the rules in force in 2021, however, eligible first-time homebuyers aged 18 to 39 could be exempt if they acquired at least 50% ownership and used the property as their permanent home. This exemption was abolished from 2024.[^transfer]

Our standard household buys its first home in the tenth year of employment, at about age 35, and is assumed to satisfy the 2021 exemption conditions. Under our fixed 2021 institutional baseline, no transfer tax is added for this transaction.

**An institutional housing extraction rate of 0.0% means that the present central estimate contains no identified charge of this kind. It does not mean Finland has no property taxes, or that urban planning cannot affect prices.**

The distinction from Shanghai is clear.

In the Shanghai model, substantial costs could be identified within the land and real estate fiscal system, making home purchases an important channel of wealth transfer from households to the institutional system.

We cannot establish a comparable land-finance extraction mechanism for Finland from the evidence currently available. High housing prices alone do not justify adding a large institutional premium to LCER.

## 6. Mortgage Rates Below 1%: Homeownership Did Not Create a Second Round of Huge Financing Costs

Beyond purchase prices, there is mortgage financing.

In the Shanghai model, high home prices combined with long-term mortgage interest to create another major lifetime burden. Mortgage principal becomes equity in the home, but interest paid to the financing system does not become household ownership.

Finland's housing finance environment in 2021 was very different.

<figure class="fr-figure"><img src="https://kewtgh.github.io/PicSunflowers/img/2026/ai-finland-the-government-took-the-money-02.jpg" alt="ai-finland-the-government-took-the-money-02" /></figure>

According to the Bank of Finland, the average interest rate on new housing loans in November 2021 was approximately **0.76%**, including **0.74%** for loans on owner-occupied homes. The average term of owner-occupied housing loans was around **21 years and 3 months**.[^mortgage]

We continue to assume a 30% down payment and a 70% mortgage:

| Mortgage item | Helsinki | Tampere |
| --- | ---: | ---: |
| Home price | €358,125 | €206,400 |
| Mortgage principal | €250,688 | €144,480 |
| Present value of mortgage interest | €14,304 | €8,244 |
| **Share of lifetime labor value** | **0.45%** | **0.29%** |

The Helsinki household needs to borrow approximately €251,000. Yet under the 2021 low-interest-rate assumption and representative Finnish loan term, interest over the entire repayment period has a present value of only about €14,300 when discounted to age 25.

That is **0.45%** of lifetime labor value. In Tampere it is just **0.29%**.

This does not mean Finnish mortgage rates stayed at their 2021 level thereafter. A substantial share of Finnish mortgages is linked to market interest rates, and subsequent rate increases can raise actual borrowing costs. The model holds the 2021 financing conditions constant so that the countries can be compared using the same base-year approach.

At least under this baseline, buying a home in Finland does not multiply an ordinary household's housing expenditure into an enormous second round of interest payments.

## 7. Education Spending Is Below the Benchmark. How Should We Account for It?

Finnish education is often cited as one of the achievements of its welfare state. But what we are calculating here is not the amount the government spends on schools. It is how much an ordinary household spends on education relative to our common benchmark.

This series uses **1.5% of household consumption** as the reference share for private education spending. If the household spends a larger share, the difference is positive and raises LCER. If it spends less, the difference is negative and reduces LCER. We no longer truncate below-benchmark differences to zero.[^education]

The calculation is:

> **Annual excess education competition spending = (Household education spending as a share of household consumption − 1.5%) × Annual household consumption.**

According to the 2021 national figures in Statistics Finland's *Finland in Figures 2023*, education accounted for **0.4%** of household consumption expenditure. The denominator here is household consumption, not GDP. But the data come from national accounts and cannot be treated as direct observations of two-earner, one-child households in Helsinki or Tampere. We use this national share as a proxy for the education-spending pattern.[^education-data]

Under this assumption:

**0.4% − 1.5% = −1.1 percentage points.**

This negative difference belongs in the model, but we cannot simply subtract 1.1 percentage points from LCER. The spending share uses household consumption as its denominator, while LCER uses the labor value created by the household over its entire working life. We need to convert the difference into an annual household budget and discount it over the years in which the expenditure occurs.

### How Much Does the Household Spend Each Year?

We use the preliminary result from Statistics Finland's 2022 Household Budget Survey for two-parent families with children: approximately **€28,700 annually per equivalised consumption unit**. An equivalised unit is neither a person nor a household. It is a statistical measure that adjusts for the ages of family members and economies of scale in shared household consumption.[^consumption-budget][^equivalence]

Converting the figure to 2021 prices using the total consumer price indices of 105.8 for 2021 and 113.4 for 2022 gives:

**€28,700 × 105.8 ÷ 113.4 = €26,776.54 per equivalised consumption unit.**

Under the modified equivalence scale, the first adult has a weight of 1, the second adult 0.5, a child aged 0–13 has a weight of 0.3, and a household member aged 14 or older has a weight of 0.5. This produces two proxy budgets for a two-adult, one-child family:

| Child's age | Equivalised household units | Annual household consumption | Education spending at 0.4% | Spending at 1.5% benchmark | Annual education difference |
| --- | ---: | ---: | ---: | ---: | ---: |
| 6–13 | 1.8 | €48,197.78 | €192.79 | €722.97 | −€530.18 |
| 14–18 | 2.0 | €53,553.09 | €214.21 | €803.30 | −€589.08 |

These amounts are household-budget proxies in 2021 prices, not survey observations for one-child families in the two cities. Converting prices cannot reconstruct all consumption behavior in 2021. Nor have we artificially scaled household consumption by the cities' wage differences.

### What Is the Lifetime Present Value of the Education Difference?

We assume the parents have their child at age 30. The child enters the education period counted here at age six, and we include the years through age 18: 13 years in total. Annual education differences are recognized at year-end and discounted at a real rate of 2% to the parents' age 25. We do not additionally assume university attendance, or spread these education differences over the parents' entire 43-year working lives.[^education-timing]

For the eight years when the child is aged 6–13, the annual difference is about −€530.18. For the five years aged 14–18, it is around −€589.08. Together, their discounted value is:

**Present value of the education difference: −€5,029.55.**

We use the same national consumption proxy in both cities, so the amount is identical. Dividing it by the respective present value of lifetime labor value gives:

| Education item | Helsinki | Tampere |
| --- | ---: | ---: |
| Present value of excess education competition spending | −€5,029.55 | −€5,029.55 |
| **Effect on LCER** | **−0.1571 percentage points** | **−0.1764 percentage points** |

In other words, education lowers the Helsinki estimate by approximately **0.16 percentage points**, and Tampere's by approximately **0.18 percentage points**.

This negative figure means that, relative to the 1.5% benchmark, the household's modeled education expenditure is lower. It is not a cash payment from the government, and we have not separately deducted the public cost of providing schools as an education benefit.

The education adjustment does not fundamentally alter Finland's overall LCER. The reason is straightforward: the difference applies to only 13 years of one child's education, while the denominator covers the combined labor value of two adults over their entire working lives.

The additional housing premium potentially caused by urban planning, institutional costs in public utilities, and other items lacking reliable monetary estimates remain outside this calculation. Attribution of public healthcare benefits, the timing of some cash flows, and the use of national proxy data for education all remain important limits on the final figures.[^model-limits]

## 8. So What Is Finland's LCER?

Putting the included components together gives:

| Component | Helsinki | Tampere |
| --- | ---: | ---: |
| Net fiscal and social insurance extraction | 28.56% | 26.17% |
| Institutional housing component (included items) | 0.00% | 0.00% |
| Mortgage interest | 0.45% | 0.29% |
| Excess education competition spending (signed proxy) | −0.16% | −0.18% |
| Housing, monopoly, and other costs not reliably quantified | Not Included | Not Included |
| **Core LCER (conditional estimate)** | **28.85%** | **26.28%** |
| **Total / Extended LCER (conditional estimate)** | **28.85%** | **26.28%** |

*Each component is expressed as a share of lifetime labor value and shown to two decimal places. The education figures of −0.16% and −0.18% mean reductions of approximately 0.16 and 0.18 percentage points in LCER. Totals use unrounded amounts from the calculation workbook rather than adding the rounded percentages above. Items not quantified remain excluded; the equality of Core and Extended LCER does not mean every institutional cost has been captured.*

In monetary terms:

| Item | Helsinki | Tampere |
| --- | ---: | ---: |
| Present value of household lifetime labor value | €3,200,733.33 | €2,851,502.94 |
| Present value of net fiscal and social insurance extraction | €913,998.04 | €746,268.63 |
| Present value of mortgage interest | €14,303.92 | €8,244.12 |
| Present value of education spending difference | −€5,029.55 | −€5,029.55 |
| **Present value of net institutional extraction after education adjustment** | **€923,272.41** | **€749,483.20** |

Under the household assumptions and conditional timing conversion adopted here, the present value of lifetime net extraction is approximately **€923,300** for Helsinki and **€749,500** for Tampere.[^calculation]

The gap between the two cities is about 2.56 percentage points. Most of it still comes from income taxes and the value of healthcare benefits relative to household labor value.

The Helsinki family earns more and pays more income tax. The model attributes the same amount of public healthcare benefits to both households, so the relative offset is greater against Tampere's smaller labor-value denominator. The national-budget proxy for education is also the same in both places, giving Tampere a slightly larger percentage-point deduction.

Housing prices matter as well, but under the low-rate assumptions of 2021, mortgage interest accounts for only about 0.16 percentage points of the LCER difference between the cities. Finland's principal source of net institutional extraction remains its fiscal and social insurance system.

## 9. Seven Countries, Fourteen Cities

Including Finland, this series now covers seven countries and fourteen cities.

| Country | City | City type | LCER |
| --- | --- | --- | ---: |
| China | Shanghai | Leading city | **101.8%** |
| China | Nanjing | Representative city | **75.3%** |
| United States | New York | Leading city | **30.3%** |
| United States | Chicago | Representative city | **23.0%** |
| Canada | Toronto | Leading city | **34.1%** |
| Canada | Winnipeg | Representative city | **26.7%** |
| United Kingdom | London | Leading city | **27.7%** |
| United Kingdom | Manchester | Representative city | **17.0%** |
| France | Paris | Leading city | **34.0%** |
| France | Lyon | Representative city | **27.8%** |
| Germany | Munich | Leading city | **38.4%** |
| Germany | Cologne | Representative city | **35.3%** |
| Finland | Helsinki | Leading city | **28.85%** |
| Finland | Tampere | Representative city | **26.28%** |

*The other countries retain the figures published in their respective articles; only Finland has been updated here. Finland now includes a signed education-spending adjustment based on proxy data, while the other countries' education components have not been recalculated in this article. Some countries also differ in their treatment of Core versus Extended LCER and discount timing. The table therefore reports the results of the individual articles, not an international ranking that has undergone a complete like-for-like audit.*

In 2021, Finland's conventional labor tax wedge for a single, childless average-wage worker was 42.7%. The conditional LCER estimate in this article for a two-earner family with one child in Helsinki is 28.85%. The two numbers concern different household types and time horizons, so their difference cannot simply be called a welfare return rate. But they illustrate why deductions from a yearly payslip cannot, on their own, answer the question this series asks.

In our earlier calculations, Munich's LCER reached 38.4%. Toronto's was 34.1%, with a substantial share coming from housing institutions and financing. Finland has a different composition. Pensions still show considerable net extraction, public healthcare offsets part of the tax burden, housing finance costs are very low, and education spending below the common benchmark produces a small negative adjustment.

**A country with high taxes does not necessarily have the highest LCER.** That does not mean taxation comes without a cost. An ordinary Finnish family still transfers a substantial portion of its labor value to the public system.

If we look only at annual payslip deductions, Finland is certainly a high-tax country. If we examine everything a family contributes and receives over a lifetime, together with the additional spending required for housing and education, the picture changes. Finland's taxes remain high. What matters just as much is where the money goes, and how much households still have to spend outside the public system.

In the next, we'll turn to Asia and examine the LCER across different Asian countries.

---

## Notes

[^lcer]: **LCER (Lifecycle Comprehensive Extraction Rate)** is defined in this series as the present value of net institutional extraction divided by the present value of household lifetime labor value. Net institutional extraction includes identifiable compulsory payments and institutionally induced indirect costs, less pension, healthcare, and other benefits reasonably attributable to the standard household. The education component in this article is separately adjusted by the signed difference between household education spending and the 1.5% benchmark; government education spending is not deducted as an additional benefit. LCER is not a total household expenditure rate, a tax rate, or the reverse of household disposable income.
[^pv]: **PV (Present Value) and real discount rate:** Cash flows occurring at different times are discounted to the point when the household begins work at age 25. A 2% real discount rate and 0% long-run real wage growth are used as common cross-country modeling assumptions.
[^pv-timing]: **Present-value timing and conditional conversion:** The original Finnish workbook used a 43-period annuity factor of 29.234794 for lifetime labor value and pension contributions, with payments at \(t=0\) through \(t=42\). The end-of-year factor for \(t=1\) through \(t=43\) is 28.661562. The conditional calculation used for the updated education component divides both the existing numerator and denominator by 1.02 before adding the new year-end education cash flows. All existing component present values reported in this article use the same conversion factor, avoiding mixed conventions in the final totals. The synchronized conversion does not change the ratios of the pre-existing components. A whole-year pension payment model has been supplied that reproduces the summarized pension amounts; see the pension cash-flow note. The detailed payment records for healthcare and mortgage components remain incomplete, however, so the aggregate PVs alone cannot establish that every transaction should be shifted forward by one year. This is not a completed line-by-line reconstruction of the entire model. The figures of 28.85% and 26.28% are conditional on this approach.
[^tax-wedge]: **Tax wedge:** The OECD's measure of the difference between an employer's total labor cost and an employee's net take-home earnings. It typically includes income tax and employer and employee social insurance contributions. Finland's 2021 figure of 42.7% concerns a single, childless average-wage worker, not the two-earner, one-child household modeled here. It does not deduct the lifetime value of pensions and healthcare, and therefore cannot be equated with LCER. Source: [OECD, *Taxing Wages 2022*](https://www.oecd.org/en/publications/taxing-wages-2022_f7f1e68a-en/full-report/component-4.html).
[^wages]: **Finnish wages and city estimates:** Statistics Finland reports a 2021 median monthly wage of €3,520 for full-time private-sector employees and €3,315 for all full-time employees nationwide. Applying regional-to-national earnings ratios to private-sector wages yields estimated monthly wages of roughly €3,886 for Helsinki and €3,462 for Tampere. These are model estimates, not directly observed city private-sector medians. Sources: [Statistics Finland, Private Sector Monthly Salaries 2021](https://stat.fi/en/publication/ckt2vzx4g0vlp0b48d6bvwkdk); [Structure of Earnings 2021](https://stat.fi/en/publication/cl8lqceyyrjo20dukt2s8fy8p).
[^tyel]: **TyEL (Employees Pensions Act):** Finland's statutory earnings-related pension scheme for private-sector employees. The average combined contribution rate in 2021 was 24.4% of cash wages, including employer and employee portions. The denominator of this contribution rate is wages, not the broader measure of labor value including mandatory employer costs used for LCER. Source: [Finnish Centre for Pensions, Year-by-year Changes](https://www.etk.fi/en/finnish-pension-system/financing-and-investments/financing-principles/year-by-year-changes/).
[^pension-age]: **Pension age and replacement rate:** *Pensions at a Glance 2021* gives a normal pension age of 68 and a gross mandatory pension replacement rate of 56.6% for an average-income Finnish worker with a full career. To match this series' assumption that work begins at 25, the model approximates a 53% replacement rate; this is not a measured average. Gross replacement rate means pre-tax annual pension divided by pre-retirement pre-tax annual wages. The pension figures shown in the article are also pre-tax, with no separate estimate of retirement income taxation in this section. These assumptions do not imply that every Finnish resident actually retired at 68 in 2021. Source: [OECD, *Pensions at a Glance 2021*, Gross Pension Replacement Rates](https://www.oecd.org/en/publications/pensions-at-a-glance-2021_ca401ebd-en/full-report/component-16.html).
[^life-expectancy]: **Remaining life expectancy at age 68:** The average number of additional years expected under a specified period's mortality rates, conditional on already having reached age 68. In Statistics Finland's 2021 life table, remaining life expectancy at 68 is 16.19 years for men and 19.38 years for women. Adding 68 gives conditional expected ages of 84.19 and 87.38, respectively. These are not life expectancies at birth or forecasts for future retirement cohorts. National estimates are used without differentiating Helsinki from Tampere. Sources: [Statistics Finland, StatFin 12ap — Life Table by Age and Sex](https://pxdata.stat.fi/PXWeb/pxweb/en/StatFin/StatFin__kuol/12ap.px); [Finland 2021 life table compiled from Statistics Finland data, age 68 row](https://www.lifetable.de/File/GetDocument/data/FIN/FIN000020212021CU1.pdf).
[^pension-cashflow]: **Pension payment periods, annual amounts, and PV approximation:** The reproducible annual cash-flow illustration uses 16 full payment years for the man and 19 for the woman, approximating the official 2021 life-table figures of 16.19 and 19.38 years. These must not be presented as identical values. The annual pension equals 53% of the individual's wage, expressed in constant 2021 purchasing power. Retirement is at \(t=43\); year-end pension payments begin at \(t=44\), ending at \(t=59\) for the man and \(t=62\) for the woman. Calculated directly, Helsinki's male PV is €143,211.88 and female PV €165,369.72, giving an unrounded total of €308,581.59. Tampere's male PV is €127,586.08 and female PV €147,326.29, giving €274,912.37. The tables retain the aggregate-conversion amounts of €308,581.37 and €274,912.75. The respective differences of about €0.22 and €0.37 do not affect LCER to two decimal places. This whole-year model reproduces the summary amounts but is neither access to the original annual records nor a complete survival-probability-weighted actuarial valuation. Fractional-year payment periods would yield slightly higher pension benefit PVs. This article explains the existing approximation rather than altering the published conditional estimates. It does not separately model survivor pensions, real indexation during retirement, or mortality before retirement.
[^health]: **Public healthcare benefit attribution:** The model estimates the lifetime present value of public healthcare services attributable to the standard household from family members' ages and Finnish public healthcare spending. €274,589 is a modeled attribution, not observed household medical expenditure or a cash transfer. A substantial share of Finnish healthcare is financed from general taxes and should therefore be considered together with the income-tax component.
[^income-tax]: **Effective income tax:** The actual income-tax burden under applicable brackets, deductions, and personal circumstances, rather than the highest marginal statutory rate. The article uses the modeled lifetime income-tax amounts supplied with the Finnish calculation.
[^vat]: **VAT (Value Added Tax) and tax incidence:** VAT is an indirect tax on goods and services. The burden ultimately borne by households depends on their consumption mix, tax rates, price pass-through, and exemptions; the standard rate cannot simply be multiplied by all wages. VAT and specific excise duties are shown separately to avoid double counting.
[^house]: **Finnish housing-price assumptions:** Representative 2021 second-hand apartment prices are taken as approximately €4,775/m² in Helsinki and €2,752/m² in Tampere. This Finnish calculation uses a 75 m² apartment, whereas some of the earlier country models use 80 m² homes, so the housing samples are not identical in size. House prices are not themselves measures of institutional extraction. Source: [Statistics Finland, Prices of Dwellings in Housing Companies, 2021](https://stat.fi/til/ashi/2021/12/ashi_2021_12_2022-01-28_tie_001_en.html).
[^transfer]: **First-time homebuyer transfer-tax exemption:** Under Finnish rules in force in 2021, qualifying first-time buyers aged 18–39 could be exempt from transfer tax on an owner-occupied home. The exemption applied to transactions signed before January 1, 2024. The model uses a fixed 2021 institutional baseline and assumes a first-home purchase in the tenth working year; it does not claim the exemption remained available in that hypothetical future calendar year. Source: [Finnish Tax Administration, Buying Your First Home](https://www.vero.fi/en/individuals/property/transfer-tax/buying_your_first_hom/).
[^mortgage]: **Mortgage rates and loan terms in 2021:** Bank of Finland data show that in November 2021, the average interest rate on new housing loans was 0.76%, including 0.74% on new loans for owner-occupied housing. The average term of an owner-occupied housing loan was 21 years and three months. This model applies a static 2021 interest-rate assumption; subsequent interest-rate changes would affect actual lifetime financing costs. Source: [Bank of Finland, *Housing Loan Market Remained Brisk in November 2021*](https://www.suomenpankki.fi/en/statistics/statistical-news/mfi-balance-sheet/2022/housing-loan-market-remained-brisk-in-november-2021/).
[^education]: **Signed excess education competition spending:** This article calculates the annual difference as \((\text{local household education spending share}-1.5\%)\times\text{household consumption}\), allowing negative values rather than setting them to zero with `max(..., 0)`. The 1.5% comparison threshold is inherited from the series' Japan-based benchmark; it is not newly verified as a Finnish statistic. A negative amount reflects lower spending relative to that benchmark, not a cash benefit or reimbursement of public education spending. Annual differences are discounted over the included education years and then divided by lifetime labor value; the difference in consumption shares cannot be subtracted directly from LCER.
[^model-limits]: **Conditional estimates, proxies, and Not Included:** Wages, pensions, healthcare, taxes, and mortgage components are carried forward from the existing Finnish model; their inclusion here does not constitute independent recertification. The education estimate uses the national education-consumption share, preliminary 2022 consumption figures for two-parent households with children, and equivalence-scale conversion, rather than direct 2021 observations of two-earner, one-child households in either city. The statistical education consumption category may also omit some spending related to children's learning; category consistency with the benchmark matters. Extra decimal places reflect arithmetic, not equivalent statistical precision. “Not Included” means the cost has not been reliably estimated or counted; it does not mean the cost has been proved zero.
[^education-data]: **Finnish education consumption share in 2021:** The “Households' consumption expenditure” table on printed page 23 of *Finland in Figures 2023* reports that education accounted for 0.4% of household consumption in 2021. The year is marked as preliminary and the source is annual national accounts. The denominator is household consumption, not GDP; nor is it specific to two-earner, one-child households. This article retains the published historical value as a proxy without claiming it is the latest revised final figure. Source: [Statistics Finland, *Finland in Figures 2023*](https://toolbox.finland.fi/wp-content/uploads/sites/2/2023/06/finland-in-figures-2023.pdf).
[^consumption-budget]: **Household consumption budget and price conversion:** In its December 28, 2023 preliminary release for the 2022 Household Budget Survey, Statistics Finland reported annual spending of approximately €28,700 per equivalised consumption unit for two-parent families with children. Converting it to 2021 prices using total CPI values of 105.8 for 2021 and 113.4 for 2022 (2015=100) yields €26,776.54. This deflation does not adjust for changes in real quantities or consumption patterns, and cannot turn a 2022 sample into direct 2021 observations of one-child families in either city. Sources: [Statistics Finland, Household Consumption Expenditure 2022, preliminary release](https://stat.fi/en/publication/cl8mrlcn2z9uh0dut08bwq5qf); CPI in [*Finland in Figures 2023*, printed page 21](https://toolbox.finland.fi/wp-content/uploads/sites/2/2023/06/finland-in-figures-2023.pdf).
[^equivalence]: **Equivalised consumption unit:** Under the modified equivalence scale, the first adult has weight 1, each other person aged at least 14 has weight 0.5, and a child aged 0–13 has weight 0.3. Two adults with one child therefore represent 1.8 units before the child turns 14 and 2.0 units thereafter. This scale standardizes household budgets; it is not a claim that every household spends exactly in these proportions. Source: [Statistics Finland, Household Consumption Expenditure, table 14ph](https://pxdata.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__ktutk/14ph.px/).
[^education-timing]: **Education period and cash-flow timing:** Parents' age 25 is \(t=0\), and the child is born when they are 30, at \(t=5\). The 13 years from ages 6 to 18 are counted with expenditures at year-end: ages 6–13 correspond to \(t=12\) through \(t=19\), and ages 14–18 to \(t=20\) through \(t=24\). Using unrounded annual differences, PV = \(-530.1755556\sum_{t=12}^{19}(1.02)^{-t}-589.0839506\sum_{t=20}^{24}(1.02)^{-t}=-€5,029.549382\). The difference is counted only over these 13 years, not again across the parents' 43-year working lives. No additional university years are assumed.
[^calculation]: **Data sources and aggregation for this article:** The education update uses *2026-10-12-Finland-Signed-Education-Proxy-Calculation.xlsx*. Other components follow *芬兰.md* and the synchronized conditional conversion factor. Helsinki LCER = \([(946868/1.02)-5029.549382]/(3264748/1.02)=28.845652\%\); Tampere LCER = \([(769603/1.02)-5029.549382]/(2908533/1.02)=26.283795\%\). Most component amounts are rounded to whole euros in the prose, while final totals and education budgets retain cents. The original Tampere component sum and fiscal/social total differ by approximately €1 because of rounding; this article follows the aggregate amount in the latest calculation sheet. No deduction for public education benefits has been added.

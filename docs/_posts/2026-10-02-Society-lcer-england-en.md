---

title: "28%: How Much of an Ordinary London Family's Lifetime Wealth Is Extracted by the UK Institutional System?"
excerpt: "—A line-by-line estimate of the Lifetime Comprehensive Extraction Rate for urban households in the UK"
header:
  teaser: /assets/img/page-header-image-smallfamily-teaser.jpg
  overlay_image: /assets/img/page-header-image-smallfamily.jpg # Add image post (optional)
  overlay_filter: 0.4
categories:
  - Social Commentary
tags: 
  - LCER
  - Household Wealth
  - Institutional Costs
  - Cost of Living
  - Property Tax
  - United Kingdom
  - England
  - Real Estate
  - Social Security
  - Household Balance Sheet
  - Intergenerational Wealth
  - Household Consumption
  - Wealth Distribution
  - Lifetime Comprehensive Extraction Rate
  - Pensions
  - Healthcare
  - Education Costs
  - London
  - Manchester
  - Tax Burden
  - Social Commentary
toc: true
toc_sticky: true
series: lcer
series_order: 4
series_label: "United Kingdom: London and Manchester"
sidebar:
  title: "Classic Series"
  nav: sidebar-series-lifecycle-extraction-en
locale: en-US
translation_key: society-article-0004-2026
last_modified_at: 2026-10-02T07:55:52-05:00
---

In the previous article, we calculated Canada's Lifetime Comprehensive Extraction Rate (LCER).

> - Toronto: 34.1%.
> - Winnipeg: 26.7%.

This time, we turn to the United Kingdom.

The final numbers are:

> - **London: 27.7%.**
> - **Manchester: 17.0%.**

London is not particularly low.

It is below Toronto's 34.1% and New York's 30.3%, but slightly above Winnipeg's 26.7%, and also above Chicago's 23.0%.

What still feels a little strange to me is Manchester.

**17.0%.**

The UK is obviously not a low-tax country. There is 20% VAT, Income Tax, and National Insurance[^ni]. You pay tax when you work and tax again when you spend. British people certainly do not lack complaints about tax either.

And yet an ordinary dual-income household in Manchester ends up with a lifetime LCER of only 17.0%.

So in this UK calculation, the part I kept checking was not really the tax itself.

It was this:

**Of all the money that gets taken away, how much eventually comes back?**

The previous three articles already explained the Lifetime Comprehensive Extraction Rate (LCER) in detail, so I will not start again from the beginning here.

The household is still the same.

Two adults begin working at age 25 and have one child. I use a 2% real discount rate, keep long-run real wage growth at 0%, assume the family buys a home in the tenth year of their career, with a 30% down payment and a 70% mortgage.

Ordinary consumption does not count as extraction.

If you buy a house, the house itself becomes a household asset, so obviously the full purchase price cannot be counted as extraction either.

Pensions and healthcare are the same.

It is not enough to look at how much was paid in. Benefits that eventually return to the household have to be deducted.

For this generation of UK workers, I use a State Pension age of 67, giving a 42-year working life.

London remains the Leading City.

For the Representative City, I use Manchester.

The central model is:

| Item | London | Manchester |
| --- | ---: | ---: |
| Individual annual wage | £39,716 | £27,700 |
| Household annual cash wage | £79,432 | £55,400 |
| Lifetime labor value PV[^pv] | £2,540,068 | £1,747,535 |
| Net fiscal/social-insurance extraction | 20.5% | 11.4% |
| Housing institutional cost | 2.2% | 2.7% |
| Mortgage interest | 4.9% | 2.9% |
| Excess education competition | Not Included | Not Included |
| **Core LCER** | **27.7%** | **17.0%** |

One thing about Manchester's 2021 wage needs to be explained first.

I could not find a 2021 Manchester city-level full-time wage figure that matched the model exactly. I therefore use the 2022 ASHE[^ashe] figure of about £29,080 and back-cast it to roughly £27,700 using the wage change between 2021 and 2022.

So the confidence level for Manchester is lower than for London.

London is currently Medium; Manchester is Medium-Low.

But even allowing for that uncertainty, Manchester is obviously not going to jump from 17% to 30%.

So we still need to look inside the number.

## 1. What Exactly Is National Insurance?

One of the most visible items on a British worker's payslip is National Insurance.

In 2021/22, the main employee Class 1 NIC rate was 12%.

The employer paid another 13.8%.

If you simply add the two together, it is easy to think:

Isn't this just a very heavy social-insurance tax?

But National Insurance is a little different:

**It is not another name for a pension contribution.**

In 2021/22, roughly £114.934 billion of National Insurance-related receipts went into the National Insurance Fund[^nif], while another £27.071 billion was allocated directly to the NHS.

That gives a rough split of:

- 80.94% to the National Insurance Fund;
- 19.06% to the NHS.

And the National Insurance Fund itself does not only pay the State Pension.

It also pays other contributory benefits.

So treating the entire 80.94% as a pension contribution actually slightly overstates net pension extraction.

I still do it this way, for a simple reason:

If I keep pushing for precision, I would have to estimate how many times an ordinary household becomes unemployed over 42 years, how much unemployment benefit it receives, whether it receives maternity-related benefits, and how much it receives from other contributory programmes.

At that point, calculation starts turning into guesswork. So for now I would rather be slightly unfavorable to the UK:

I assign the entire NIF portion to pension contributions and do not separately deduct the other benefits.

## 2. Start With Pensions: Manchester Already Begins to Look Different

In 2021/22, the UK's full new State Pension[^state-pension] was:

**£179.60/week.**

That is about **£9,339 a year.**

If both adults have complete contribution records, the household's State Pension after retirement is roughly:

**£18,678/year.**

The number of years for which it is received cannot simply be calculated as “life expectancy at birth minus 67.”

Once we assume someone has already survived to 67, the mortality risk of the first 67 years is already behind them.

So the model still uses conditional remaining life expectancy after reaching retirement age.

Discounted back to age 25, the present value of the couple's lifetime State Pension benefits is about:

**£122,092.**

That £122,092 is the same in the London and Manchester models.

<figure class="fr-figure"><img src="https://kewtgh.github.io/PicSunflowers/img/2026/london-ai-city-view.jpg" alt="london-ai-city-view" /></figure>

London has higher income, so it pays more National Insurance over a lifetime.

- Using the split above, the present value of the London household's contributions allocated to pensions is about:

  **£360,105.**

  After deducting £122,092 of pension benefits: **net £238,014.**

- For Manchester, the lifetime contribution PV allocated to pensions is only:

  **£218,409.**

  But the State Pension benefit is still about: **£122,092.**

  So the net gap falls to only: **£96,318.**

There is nothing especially complicated about this. Lower wages mean lower contributions.

But the UK State Pension does not fall in proportion just because someone lives in Manchester and earns less than someone in London.

So for a household like Manchester's, the same basic pension naturally represents a larger share of lifetime labor value.

Pensions alone already create a substantial gap between London and Manchester.

## 3. Then Comes the NHS

The biggest force pulling the UK result downward is healthcare.

In 2021, publicly financed healthcare spending in the UK was **£233.1 billion.**

That works out to roughly **£3,477 per person per year.**

Of course, you cannot simply multiply that number by a three-person household and then multiply again by several decades.

A healthy 30-year-old and an 80-year-old do not use the healthcare system at anything close to the same rate.

Children are different too.

So the current model adjusts for age using the ONS healthcare-use profile:

- working-age adults: about 75% of national per-capita healthcare spending;
- children: about 70%;
- after retirement: about 180%.

This needs to be stated clearly:

Those percentages are not an ONS-published “standard household healthcare benefit coefficient.” They are model estimates, so this part carries its own uncertainty.

After applying the age differences year by year and discounting everything back to age 25 at 2% in real terms, the present value of NHS healthcare benefits attributable to one standard household over its lifetime is about:

> **£265,566.**

Now compare that with the portion of National Insurance actually allocated to the NHS.

- London: **£84,799.**
- Manchester: **£51,432.**

That produces a result that looks rather odd.

London's net healthcare extraction is:

> **−£180,768.**

Manchester's is:

> **−£214,135.**

It is negative.

This absolutely does not mean the NHS simply hands every household more than £200,000 for free.

The rest of NHS funding still comes from Income Tax, VAT, Corporation Tax, and other general revenues.

Those taxes are already counted elsewhere in the model.

So I cannot treat the full £265,566 as an extra “government gift”; nor can I add a fictional “NHS tax” after Income Tax and VAT have already been counted. That would count the same money twice.

In LCER, I am doing something fairly mechanical:

- how much identifiable compulsory financing this household pays toward public healthcare;
- how much public healthcare service can be attributed back to the household over its lifetime;

and then subtracting one from the other.

At this point, the UK already begins to look different from the countries calculated earlier.

## 4. 2021 Was an Unusual Year, but the Effect Is Not That Simple

There is another issue that needs to be addressed.

2021 was obviously not a normal year for UK healthcare spending.

The pandemic was not over.

Testing, vaccines, prevention measures, and additional medical capacity all pushed government healthcare spending above pre-pandemic levels.

So when I first looked at the £233.1 billion figure, I had the same concern:

If a pandemic-year NHS spending level is used to represent the healthcare benefit a household receives over the next several decades, does that overstate the benefit return and therefore push the UK's LCER too low?

But the answer is not that simple.

Healthcare spending was not the only thing affected by the pandemic in 2021.

Income was affected too.

And LCER is calculated as:

> **Lifetime institutional net cost / Lifetime labor value.**

Higher NHS spending increases benefit return and therefore reduces the net cost in the numerator.

But if wages and labor income in the same year were below their normal trend because of the pandemic, then the labor-value base used in the model is also smaller: the denominator falls at the same time.

One effect pushes LCER down; the other pushes it up.

So we cannot simply observe that:

**The NHS spent more in 2021.**

and then immediately conclude:

**The UK's LCER must therefore be materially understated.**

What we really need are two counterfactuals:

What would normal UK NHS spending have been in 2021 without the pandemic?

And at the same time, what would normal wages for ordinary workers in London and Manchester have been?

Only after replacing both figures could we know which way the final ratio would move.

At the moment, I do not have sufficiently reliable data to make that complete counterfactual adjustment.

And this entire series uses 2021 as the common base year in the first place.

So I keep the actual 2021 data here.

It is obviously not a perfect year.

But the pandemic bias in UK LCER is probably smaller than it looks if we focus only on NHS spending.

At least for now, I do not think the higher healthcare spending in 2021 is enough, by itself, to conclude that London's 27.7% and Manchester's 17.0% are materially understated.

A more accurate statement is:

**2021 changed both benefit return and labor income. Those two changes partly offset each other; the remaining net bias cannot currently be estimated with confidence.**

So I make no additional adjustment here.

## 5. Income Tax Is Actually the Straightforward Part

UK Income Tax is comparatively simple in this model.

In 2021/22, the Personal Allowance was £12,570.

- Basic Rate: 20%.

- Higher Rate: 40%.

---

- In the London model, each person earns £39,716, so most taxable income remains within the Basic Rate band.

  The household pays about **£10,858** in Income Tax per year.

  Discounted over 42 years: **£306,585.**

- The Manchester household pays about **£6,052 a year.**

  Lifetime present value: **£170,877.**

Consumption taxes are similar in principle.

I do not simply multiply household income by the 20% VAT rate, because ordinary households do not spend all of their income on goods and services subject to standard-rate VAT.

Housing, some food, financial services, education, children's goods, and many other categories receive different tax treatment.

So I use ONS household tax-incidence data to estimate the actual indirect-tax burden.

- In the London model, VAT has a present value of about **£118,200.**

  Other excise and indirect taxes: **£39,400.**

- For Manchester, the equivalent figures are about **£109,577** and **£36,526.**

Put everything together and the UK's true net fiscal and social-insurance extraction becomes:

> **London: £521,431, or about 20.5%.**
>
> **Manchester: £199,163, or about 11.4%.**

At this point, Manchester's relatively low result is easier to understand.

It is not because Manchester does not pay tax.

It is because income is lower, so Income Tax and NIC are lower, while the State Pension and NHS do not fall proportionally with wages.

At least, that is what the current model shows.

## 6. Then We Get to the UK's Most Difficult Part: Housing

If we look only at fiscal and social insurance, London is at 20.5%.

Manchester is only 11.4%.

Now housing.

In December 2021, the average home price in London was **£521,146.**

The model's London household has annual cash wages of **£79,432.**

So the home price is about:

> **6.56 times annual household cash wages.**

The average Manchester home price was **£211,873.**

Household cash wages were **£55,400.**

The price-to-income ratio is:

> **3.82 times.**

Those two figures look very much like what people would expect from London and Manchester.

But the next number looks strange.

If we calculate only SDLT[^sdlt] and Council Tax[^council-tax], housing institutional extraction is:

- London: **2.2%.**
- Manchester: **2.7%.**

Manchester is actually higher.

Because what I am calculating here is not:

**How expensive is the house?**

It is the part of the housing cost that can currently be identified as institutional cost and does not become an equivalent household asset.

If a London household buys a £521,146 home, it still owns a home worth roughly £521,146 afterward.

You cannot call the whole half-million pounds extraction just because the house is expensive.

So the components I can currently calculate with reasonable confidence are mainly SDLT and Council Tax.

Financing is a separate line.

## 7. Manchester Homes Are Cheaper, but Council Tax Is Not

After October 2021, the UK's normal SDLT schedule had resumed.

On a London home worth £521,146, SDLT is about:

**£16,057.**

For a £211,873 Manchester home, assuming the household qualifies as a first-time buyer:

**£0.**

At this point, you might expect London to be clearly heavier.

But Council Tax is a little counterintuitive.

- In 2021/22, the London model uses an average Band D Council Tax of about **£1,622 a year.**
- Manchester: **£1,805.84 a year.**

So Manchester's home price is only about 40% of London's, yet its Council Tax is actually higher.

And Manchester's lifetime labor-value base is only £1.75 million, far below London's £2.54 million.

So as a share of lifetime labor value:

London's housing institutional cost is:

> **£55,613, or about 2.2%.**

Manchester's is:

> **£47,251, or about 2.7%.**

So Manchester is slightly higher on this item.

But the 2.2% and 2.7% only include housing institutional costs that can currently be identified directly.

The difficult part for London comes next.

## 8. I Do Not Include London's Planning Premium

The effect of the UK's planning system on housing supply has been studied for many years.

The existing evidence broadly supports the following:

Planning restrictions in England constrain housing supply and, in high-demand areas such as London, cause more of a demand increase to be capitalized into house prices.

So the real question is not:

“Do UK planning restrictions raise housing costs at all?”

There is not much dispute over that.

The difficult question is:

> **Of the £521,146 price of an ordinary London home in 2021, how many pounds were caused by planning restrictions?**

10%?

20%?

40%?

More?

Different studies use different cities, time periods, and counterfactuals.

I have not yet found a 2021 London city-level parameter that I consider reliable enough to put directly into this model.

The same problem applies to Manchester.

So the treatment is simple:

> **Planning premium[^planning-premium]: Not Included.**

It is not included in the model.

That means London's 27.7% may still be understated.

But I cannot simply look at a £521,146 house and decide that 30% of it must be planning cost.

That would make it very easy to push the result up by several, or even more than ten, percentage points. But the number itself would stop meaning much.

So I leave it blank for now.

If better city-level monetization becomes available later, I can add it then.

## 9. A UK Mortgage Cannot Use the 2021 Rate of 1.58% for 25 Years

UK housing finance works very differently from the US.

I keep the same home-purchase assumptions used throughout the series:

- 30% down payment;
- 70% mortgage;
- 25-year amortisation[^amortisation].

That gives initial mortgage balances of:

> London: **£364,802.**
>
> Manchester: **£148,311.**

In 2021, the Bank of England's representative rate for a 75% LTV[^ltv], 5-year fixed[^fixed-mortgage] mortgage was only:

**1.58%.**

But there is an important point here:

That is a **five-year fixed rate.**

Not 25 years.

UK mortgages commonly use two- or five-year fixed periods and are repriced or remortgaged[^remortgage] when the fixed period ends.

So for a household taking a five-year fixed mortgage in 2021, 1.58% only locks in the first five years.

By 2026, the mortgage has to be repriced.

Using a 25-year amortisation schedule, after the first five years:

- London's remaining mortgage balance is about **£302,885.**
- Manchester's is about **£123,138.**

If house prices are assumed unchanged, both loans have fallen to an LTV of roughly:

**58.1%.**

So at the first repricing, a 60% LTV five-year fixed product is a better approximation than the original 75% LTV product.

Bank of England data show that in August 2026, the average rate on a UK 60% LTV, five-year fixed mortgage was:

**4.62%.**

The model therefore uses:

> **1.58% for the first five years; 4.62% thereafter as the currently observable proxy for the remaining term.**

That does not mean I am assuming UK mortgage rates will literally remain at 4.62% from 2026 to 2046.

Under a stricter simulation, the loan would be repriced again in 2031, and again in 2036.

But nobody today knows what UK mortgage rates will be in 2031 or 2036.

So rather than inventing a future interest-rate path, I use the observable market rate at the first actual repricing as the central estimate for the remaining term.

When future data arrive, the model can be updated.

The result is:

### London

Monthly payment for the first five years: about **£1,473.**

After repricing in 2026, the monthly payment for the remaining 20 years rises to about **£1,936.**

Total nominal interest over 25 years is about **£188,172.**

Taking into account that the household buys in the tenth year of its career and discounting back to age 25 at a 2% real rate:

> **Mortgage interest PV ≈ £125,335.**

As a share of lifetime labor value:

> **4.9%.**

### Manchester

<figure class="fr-figure"><img src="https://kewtgh.github.io/PicSunflowers/img/2026/manchester-ai-city-view.jpg" alt="manchester-ai-city-view" /></figure>

Monthly payment for the first five years: about **£599.**

After repricing: **£787.**

Total nominal interest over the full mortgage term is about **£76,502.**

Discounted back to age 25:

> **Mortgage interest PV ≈ £50,955.**

As a share of lifetime labor value:

> **2.9%.**

That is much higher than a model that simply carries the 2021 rate of 1.58% forward.

But it also better reflects how UK housing finance actually works.

The low 2021 mortgage rate did not give British homebuyers 25 years of cheap financing.

It only locked in the first fixed period.

That is very different from the US.

An American who took out a 30-year fixed mortgage in 2021 may genuinely have locked in the low rate of that year for three decades.

A British borrower who took a five-year fixed mortgage in 2021 still had to face the market again five years later.

So even though a London household could borrow at only 1.58% in 2021, the lifetime mortgage cost still reaches about 4.9% of LCER.

That is also an important reason why London's total LCER ends up at 27.7%.

## 10. Another UK Item That Is Easy to Miscount: Workplace Pensions

The UK's automatic workplace pension enrolment[^auto-enrolment] can also be misleading if handled carelessly.

The minimum total contribution is usually about 8%, with the employer contributing at least around 3%.

The contribution is compulsory to a degree.

Employees cannot spend it like ordinary cash wages, but it ultimately becomes their own pension asset.

So I treat it the same way as in the earlier country models:

The employer's mandatory pension contribution is included in labor value.

The employer really does incur that cost to employ you.

But I do not then put the entire 8% into the LCER numerator.

Otherwise I would be saying, on the one hand:

“This money was taken away.”

while pretending, on the other hand, that there is no asset sitting in the worker's retirement account.

Forced saving can be unpleasant. Liquidity restrictions are a real cost too.

But as long as the asset still belongs to the household, it cannot simply be treated as having been “extracted.”

## 11. I Do Not Include Education Either

The UK has private schools.

Tutoring.

School catchment areas.

Oxbridge.

And all kinds of competition around university admission.

But that is not the same question as:

> “How much excess education spending attributable to institutional competition does an ordinary one-child UK household incur over its lifetime?”

At the moment, I have not found sufficiently reliable evidence showing that private education spending by an ordinary UK household consistently exceeds the 1.5% normal-education-spending benchmark used in this series.

So:

> **Excess Education Competition: Not Included.**

That does not mean education competition does not exist in the UK.

It simply means I do not count it here.

## 12. Put the Whole Account Together

### London

Net fiscal and social-insurance extraction:

**20.5%.**

Housing institutional cost:

**2.2%.**

Mortgage interest:

**4.9%.**

Education and other institutional costs that cannot yet be monetized reliably:

**Not Included.**

Final result:

> **27.7%.**

### Manchester

Net fiscal and social-insurance extraction:

**11.4%.**

Housing institutional cost:

**2.7%.**

Mortgage interest:

**2.9%.**

Other items that cannot yet be monetized reliably:

**Not Included.**

Final result:

> **17.0%.**

The full central estimate is:

| Item | London | Manchester |
| --- | ---: | ---: |
| Net fiscal/social-insurance extraction | 20.5% | 11.4% |
| Housing institutional cost | 2.2% | 2.7% |
| Mortgage interest | 4.9% | 2.9% |
| Excess education competition | Not Included | Not Included |
| Planning Premium | Not Included | Not Included |
| Other institutional costs | Not Included | Not Included |
| **Core LCER** | **27.7%** | **17.0%** |

In money terms:

- A London household creates about:

  **£2.54 million** in lifetime labor value, in present-value terms.

  Institutional net costs currently included in the central model are about:

  **£702,000.**

- A Manchester household creates about:

  **£1.75 million** in lifetime labor value.

  The corresponding institutional net cost is about:

  **£297,000.**

That is the current UK result.

## 13. Do I Still Think Manchester's 17.0% Looks Low?

Yes.

But London and Manchester now need to be looked at separately.

London is 27.7%.

Placed alongside the countries calculated earlier, that number is no longer especially unusual.

Toronto is 34.1%.

New York is 30.3%.

London is 27.7%.

Winnipeg is 26.7%.

Chicago is 23.0%.

London sits somewhere in the middle.

And it still has a planning premium that is not included.

So for London, the question is no longer really “why is the UK so low?”

It is more a question of which costs still cannot be monetized reliably.

---

Manchester is still different.

17.0% is still clearly low.

Its wages are lower, so Income Tax is naturally lower.

National Insurance is lower.

Housing is much cheaper, and the mortgage is much smaller.

But once the household reaches retirement, the State Pension does not fall in proportion to the wage gap between Manchester and London.

The NHS is similar.

After deducting those benefits, Manchester's net fiscal and social-insurance extraction is only 11.4%.

Even after mortgage repricing raises the financing component to 2.9%, the final result is still only 17.0%.

So I still would not treat 17.0% as an extremely precise answer.

Manchester's wage itself is an estimate.

Lifetime NHS benefits require modelling.

And the mortgage rate for the next 20 years can only use the current rate as a proxy.

London has a different problem.

The £521,146 home price is real.

Planning restrictions are real too.

But I still do not have a satisfactory number for how thick the line between those two facts should be.

So for now, I leave it uncounted.

We now have data for four countries:

| Country | City | Type | LCER |
| --- | --- | --- | ---: |
| China | Shanghai | Leading City | **101.8%** |
| China | Nanjing | Representative City | **75.3%** |
| United States | New York | Leading City | **30.3%** |
| United States | Chicago | Representative City | **23.0%** |
| Canada | Toronto | Leading City | **34.1%** |
| Canada | Winnipeg | Representative City | **26.7%** |
| United Kingdom | London | Leading City | **27.7%** |
| United Kingdom | Manchester | Representative City | **17.0%** |

In the next article, we will move from the UK to continental Europe and look at the LCER of a typical continental European country.

---

[^pv]: **PV (Present Value)**: Future income, contributions, benefits, or costs are converted into today's value using a discount rate. This article uses a 2% real discount rate throughout, so that £1 received or paid decades from now can be compared on the same basis with £1 today.

[^ni]: **National Insurance (NI)**: The UK's system of compulsory social-insurance contributions on labor income, paid by both employees and employers. It is not an individual pension account. The money supports the State Pension and some other social-security benefits, while a portion is allocated directly to the NHS.

[^nif]: **National Insurance Fund (NIF)**: The fund into which most National Insurance receipts flow. It finances the State Pension as well as some contributory unemployment, maternity, incapacity, and other benefits. In this article, allocating the whole NIF share approximately to “pension contributions” is therefore a deliberately conservative treatment.

[^nhs]: **NHS (National Health Service)**: The UK's predominantly publicly financed healthcare system. Residents generally do not pay the full economic cost at the point of use for most NHS services. In this article, the value of NHS services attributable to the household is treated as a benefit return and deducted from institutional cost.

[^state-pension]: **State Pension**: The UK public pension paid by the government on the basis of National Insurance contribution records. It is not simply proportional to an individual's wage, which means that for lower-income workers the State Pension often represents a larger share of lifetime labor income.

[^sdlt]: **SDLT (Stamp Duty Land Tax)**: A one-off transaction tax paid when purchasing residential property or land above certain thresholds in England and Northern Ireland. Rates are progressive by band, and relief is available for some first-time buyers. Scotland and Wales use different property-transaction taxes. Because both London and Manchester are in England, this article uses SDLT.

[^council-tax]: **Council Tax**: An annual local tax on residential properties in England, Scotland, and Wales, used mainly to fund local public services. It is not charged as a simple percentage of current market value. Instead, it depends on the property's valuation band and the rate set by the local authority, so a cheaper city does not necessarily have lower Council Tax.

[^ashe]: **ASHE (Annual Survey of Hours and Earnings)**: An annual earnings survey conducted by the UK Office for National Statistics. It is one of the main official sources for wage levels, earnings distributions, and pay by occupation in the UK.

[^ltv]: **LTV (Loan-to-Value)**: The ratio of the outstanding mortgage balance to the value of the property. For example, if a £500,000 home has a £350,000 mortgage, the LTV is 70%. In general, a lower LTV means less collateral risk for the lender and may qualify for a lower mortgage rate.

[^fixed-mortgage]: **Fixed-rate mortgage**: A mortgage whose interest rate remains unchanged for an agreed fixed period. In the UK, two- and five-year fixed periods are common, rather than the 30-year fully fixed structure common in the US. When the fixed period ends, the borrower usually accepts a new rate or refinances/remortgages.

[^amortisation]: **Amortisation**: The process by which principal and interest are repaid over a scheduled loan term. This article assumes a 25-year total mortgage term, so even if the interest rate is reset every five years, the principal balance still declines according to the overall 25-year repayment schedule.

[^remortgage]: **Remortgage**: When a UK borrower's fixed-rate period ends, the borrower may select a new product with the same lender or move the mortgage to another lender. The new rate is determined by prevailing market rates, the remaining loan balance, LTV, and the borrower's circumstances.

[^planning-premium]: **Planning premium**: The part of a home's price that can be attributed to land-use planning, development-permission constraints, and limits on housing supply relative to a counterfactual with fewer supply restrictions. There is substantial evidence that UK planning constraints affect house prices, but it remains difficult to estimate precisely how much of the price of an ordinary London home in 2021 should be assigned to this premium. For that reason, it is not included in the central LCER estimate.

[^auto-enrolment]: **Workplace pension auto-enrolment**: The UK system under which eligible employees are generally enrolled automatically into a workplace pension, with contributions coming from the employee, employer, and tax relief. Although participation has a compulsory element, the money ultimately becomes the worker's own pension asset, so this article does not treat the full contribution as institutional net extraction.

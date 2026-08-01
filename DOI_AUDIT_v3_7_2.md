# DOI audit and correction report — v3.7.2

Audit date: 2026-08-01

## Scope

- Japanese peer-reviewed paper records: 52
- English peer-reviewed paper records: 37
- Existing DOI strings before this patch: 47 unique paper records in the Japanese page

## Validation result

- 46 of the 47 existing DOI records were resolved and title-matched by the published OpenAlex update data.
- The remaining DOI, `10.11492/ceispapers.ceis37.0_27`, was not found in OpenAlex but resolves through DOI.org and is confirmed by NIES/A-PLAT and KAKEN records.
- No incorrect DOI was identified among the DOI values already entered.

## DOI additions

1. Sun et al. (2026), *Rooftop photovoltaics and energy equity: quantifying socio-energy trade-offs in urban energy transitions*
   - Journal: Applied Energy
   - Volume/article: 424, 128440
   - DOI: `10.1016/j.apenergy.2026.128440`

2. Kusaka, Takata, and Takane (2010), *Reproducibility of Regional Climate in Central Japan Using the 4-km Resolution WRF Model*
   - Journal: SOLA
   - Volume/pages: 6, 113–116
   - DOI: `10.2151/sola.2010-029`

## Records for which no DOI could be confirmed

The following records are retained with their official journal/PDF links and no guessed DOI:

1. Okada et al. (2014), 「夏季における岐阜県多治見市の気温分布調査」, 天気, 61, 23–29.
2. Takane et al. (2012), 「IPCC SRES A2シナリオ下での三大都市圏の夏季気候の将来予測」, 日本ヒートアイランド学会論文集, 7, 18–26.
3. Kusaka et al. (2012), 「オープンスペースで実施した定点観測によって捉えられた夏季晴天日におけるつくば市のヒートアイランド」, 日本ヒートアイランド学会論文集, 7, 1–9.

## Additional bibliographic corrections

- Corrected the official page range of the 2012 Tsukuba urban heat-island paper from `1–8` to `1–9`.
- Removed the stray colon from the official PDF URL `12A001.pdf:`.

## Result after patch

- Japanese page: 49 of 52 peer-reviewed paper records have confirmed DOI values; 3 records retain official non-DOI links.
- English page: all 37 peer-reviewed paper records have confirmed DOI values.
- After deploying the patch, run the `Update publication metrics` GitHub Action again so OpenAlex metrics are fetched for the two newly added DOI records.

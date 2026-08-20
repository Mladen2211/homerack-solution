export default defineEventHandler(() => {
  const responses = getSurveyResponses()

  const interestCounts = new Map<string, number>(INTEREST_OPTIONS.map((option) => [option, 0]))
  const sizeCounts = new Map<string, number>(SIZE_OPTIONS.map((option) => [option, 0]))

  for (const response of responses) {
    if (response.interest && interestCounts.has(response.interest)) {
      interestCounts.set(response.interest, interestCounts.get(response.interest)! + 1)
    }
    for (const size of response.sizes) {
      if (sizeCounts.has(size)) {
        sizeCounts.set(size, sizeCounts.get(size)! + 1)
      }
    }
  }

  const comments = responses
    .filter((response) => response.comment.trim().length > 0)
    .map((response) => ({ id: response.id, comment: response.comment, createdAt: response.createdAt }))
    .reverse() // newest first

  return {
    total: responses.length,
    updatedAt: new Date().toISOString(),
    firstResponseAt: responses[0]?.createdAt ?? null,
    interest: INTEREST_OPTIONS.map((option) => ({ option, count: interestCounts.get(option)! })),
    sizes: SIZE_OPTIONS.map((option) => ({ option, count: sizeCounts.get(option)! })),
    comments,
  }
})

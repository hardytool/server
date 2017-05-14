function getStandings(req, res) {
  var standings = {
    division: {
      id: 'ba577873-626b-4bf5-aa2c-56bb204a6650',
      name: 'PST-SUN'
    },

    season: {
      id: '32657c99-6714-422d-988a-8cbc424ffbbd',
      name: 'Season 1',
    },

    rankings: [
      {
        id: '7a59704c-5cc0-436c-b35b-c8702cf51f56',
        logo: 'https://riki.dotabuff.com/t/l/CVLcPtSOYd.png',
        name: 'Blood Blarg Blam',
        wins: 10,
        losses: 5
      },
      {
        id: 'a5b8374d-e3a4-4eae-9d74-2739954d54ca',
        logo: 'https://riki.dotabuff.com/t/l/6LkyWxI7Et.png',
        name: 'Disburg Disblarg Disband',
        wins: 5,
        losses: 10
      }
    ]
  }

  res.json(standings)
}

module.exports = getStandings

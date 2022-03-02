<div align="center">
  <img src="https://cloud.githubusercontent.com/assets/399657/21955696/46e882d4-da3e-11e6-94a6-720c34e27df7.jpg" />
  <div>Computerlinguistik Im Browser!</div>
  <a href="https://npmjs.org/package/kompromiss">
    <img src="https://img.shields.io/npm/v/kompromiss.svg?style=flat-square" />
  </a>
  <a href="https://nodejs.org/api/documentation.html#documentation_stability_index">
    <img src="https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square" />
  </a>
</div>

`de-compromise` (kompromiss) is a **work-in-progress** port of [compromise](https://github.com/nlp-compromise/compromise) in german.

The goal of this project is to provide a small, basic, rule-based POS-tagger.
<h2 align="center">
  <a href="https://rawgit.com/nlp-compromise/de-compromise/master/demo/basic/index.html">Demo</a>
</h2>

```
git clone https://github.com/nlp-compromise/de-compromise.git
cd de-compromise
npm install
npm test
npm watch
```

```js
import ldv from 'de-compromise'
var dok= ldv('Ich, ich bin dann König. Und du, du Königin. Werden wir Helden für einen Tag.')
dok.match('#Noun').out('array')
// ['Ich', 'König', 'du', 'Königin', 'Werden', 'Helden']
```

please join to help! - Bitte beitreten, um zu helfen!

<table>
  <tr align="center">
    <td>
      <a href="https://www.twitter.com/compromisejs">
        <img src="https://cloud.githubusercontent.com/assets/399657/21956672/a30cf206-da53-11e6-8c6c-0995cf2aef62.jpg"/>
        <div>&nbsp; &nbsp; &nbsp; Twitter &nbsp; &nbsp; &nbsp; </div>
      </a>
    </td>
    <td>
      <a href="http://slack.compromise.cool/">
        <img src="https://cloud.githubusercontent.com/assets/399657/21956671/a30cbc82-da53-11e6-82d6-aaaaebc0bc93.jpg"/>
        <div>&nbsp; &nbsp; &nbsp; Slack group &nbsp; &nbsp; &nbsp; </div>
      </a>
    </td>
    <td>
      <a href="http://nlpcompromise.us12.list-manage2.com/subscribe?u=d5bd9bcc36c4bef0fd5f6e75f&id=8738c1f5ef">
        <img src="https://cloud.githubusercontent.com/assets/399657/21956670/a30be6e0-da53-11e6-9aaf-52a10b8c3195.jpg"/>
        <div>&nbsp; &nbsp; &nbsp; Mailing-list &nbsp; &nbsp; &nbsp; </div>
      </a>
    </td>
    <td>
      <a href="https://github.com/nlp-compromise/compromise/wiki/Contributing">
        <img src="https://cloud.githubusercontent.com/assets/399657/21956742/5985a89c-da55-11e6-87bc-4f0f1549d202.jpg"/>
        <div>&nbsp; &nbsp; &nbsp; Pull-requests &nbsp; &nbsp; &nbsp; </div>
      </a>
    </td>
  </tr>
</table>

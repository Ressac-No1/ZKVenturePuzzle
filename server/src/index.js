import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
//import reportWebVitals from './reportWebVitals';
import { groth16 } from "snarkjs";
import path from "path";
import fs from "fs";

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/api/registerVk', async (req, res) => {
  const vk = JSON.parse(fs.readFileSync(
    path.join(process.cwd(), "public/puzzle_verify_key.json")
  ));
  const whereIsVkRegStatus = path.join(process.cwd(), "config/VKeyRegistrationStatus.json");

  const { proofType, proofOptions } = req.body;
  if (!proofType || !proofOptions) {
    res.status(400).json({ error: "must provide proof type and proof options for verification key registration" });
  } else {
    if (fs.existsSync(whereIsVkRegStatus)) {
      const regInfo = JSON.parse(fs.readFileSync(whereIsVkRegStatus));
      if (JSON.stringify(regInfo.vKey) == JSON.stringify(vk) && regInfo.regStatus) {
        res.status(200).json({ vKey: vk });
        return;
      }
    }

    const API_URL = `${process.env.API_BASE_URL}/register-vk/${process.env.API_KEY}`;
    //console.log(API_URL, proofType, proofOptions, vk);
    const regParams = {
      proofType,
      proofOptions,
      vk,
    };

    try {
      const regRes = await axios.post(API_URL, regParams);
      //console.log(regRes);
      fs.writeFileSync(
        whereIsVkRegStatus,
        JSON.stringify({
          vKey: vk,
          regStatus: regRes.data,
        })
      );
      res.status(200).json({ vKey: vk });
    } catch (error) {
      fs.writeFileSync(
        whereIsVkRegStatus,
        JSON.stringify({
          vKey: vk,
          error,
        })
      );
      res.status(500).json({ error })
    }
  }
});

app.post('/api/generateProof', async (req, res) => {
  const { gridC, gridR, maxMove, walletAccount, dirLimits, treasureTypes, treasureValueByType, steps } = req.body;

  const wasm = fs.readFileSync(
    path.join(process.cwd(), "public/puzzle.wasm")
  );
  const zKey = fs.readFileSync(
    path.join(process.cwd(), "public/puzzle_1.zkey")
  );

  if (dirLimits.length !== gridC * gridR || treasureTypes.length !== gridC * gridR || !steps)
    res.status(500).json({ error: "Misaligned parameters" });
  else {
    const account = BigInt(walletAccount, 16);

    const treasureValues = treasureTypes.map((t) => {
      if (t <= 0 || t > treasureValueByType)
        return 0;
      else
        return treasureValueByType[t - 1];
    });

    const puzzleChecksum = dirLimits
      .map((val, idx) => val * maxMove + treasureValues[idx])
      .reduce((prod, val) => prod * account + BigInt(val), 0n);

    const stepList = steps.length > maxMove 
      ? steps.slice(0, maxMove + 1)
      : steps.concat(Array(maxMove + 1 - steps.length).fill(steps[steps.length - 1]));

    try {
      const { proof, publicSignals } = await groth16.fullProve(
        { account, puzzleChecksum, dirLimits, treasureValues, stepList },
        wasm,
        zKey
      );
      res.status(200).json({ proof, publicSignals });
    } catch (error) {
      res.status(500).json({ error });
    }
  }
});

app.post('/api/submitProof', async (req, res) => {
  const SUBMIT_PROOF_API_URL = `${process.env.API_BASE_URL}/submit-proof/${process.env.API_KEY}`;

  try {
    const submitRes = await axios.post(SUBMIT_PROOF_API_URL, req.body);
    
    if (submitRes.data.optimisticVerify != "success") {
      res.status(500).json({ verified: false, error: "Optimistic verification failed, check the proof artifacts" });
      return;
    }

    const JOB_STATUS_API_URL = `${process.env.API_BASE_URL}/job-status/${process.env.API_KEY}`;
    const { jobId } = submitRes.data;
    while (true){
      const jobStatusRes = await axios.get(`${JOB_STATUS_API_URL}/${jobId}`);
      if (jobStatusRes.data.status === "Finalized"){
        console.log("Job finalized successfully");
        console.log(jobStatusRes.data);
        res.status(200).json({ verified: true, txHash: jobStatusRes.data.txHash });
        return;
      } else {
        console.log("Job status: ", jobStatusRes.data.status);
        console.log("Waiting for job to finalize...");
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  } catch (error) {
    res.status(500).json({ verified: false, error });
  }
});

app.listen(port, () => console.log(`Server listening on localhost:${port}`));


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
